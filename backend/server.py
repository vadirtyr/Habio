from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta, date


# --- Config ---
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24 * 7  # 7 days for convenience

DIFFICULTY_COINS = {"easy": 5, "medium": 10, "hard": 20}

# --- DB ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- App ---
app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============== Helpers ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def coins_for(difficulty: Optional[str], custom_coins: Optional[int]) -> int:
    if custom_coins is not None and int(custom_coins) > 0:
        return int(custom_coins)
    if difficulty and difficulty.lower() in DIFFICULTY_COINS:
        return DIFFICULTY_COINS[difficulty.lower()]
    return 10


def clean_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "coin_balance": u.get("coin_balance", 0),
        "created_at": u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def log_transaction(user_id: str, amount: int, type_: str, source: str, source_id: str, description: str):
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": amount,
        "type": type_,  # "earn" or "spend"
        "source": source,
        "source_id": source_id,
        "description": description,
        "created_at": now_utc_iso(),
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)
    return tx


# ============== Models ==============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class HabitIn(BaseModel):
    name: str
    description: Optional[str] = ""
    frequency: Literal["daily", "weekly"] = "daily"
    difficulty: Optional[Literal["easy", "medium", "hard"]] = "medium"
    custom_coins: Optional[int] = None
    icon: Optional[str] = "flame"


class TaskIn(BaseModel):
    name: str
    description: Optional[str] = ""
    difficulty: Optional[Literal["easy", "medium", "hard"]] = "medium"
    custom_coins: Optional[int] = None
    due_date: Optional[str] = None


class RewardIn(BaseModel):
    name: str
    description: Optional[str] = ""
    cost: int = Field(gt=0)
    icon: Optional[str] = "gift"


# ============== Auth Routes ==============
@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name or email.split("@")[0],
        "coin_balance": 0,
        "created_at": now_utc_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=ACCESS_TOKEN_MINUTES * 60, path="/")
    return {"token": token, "user": clean_user(user_doc)}


@api_router.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=ACCESS_TOKEN_MINUTES * 60, path="/")
    return {"token": token, "user": clean_user(user)}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return clean_user(user)


# ============== Habits ==============
@api_router.get("/habits")
async def list_habits(user: dict = Depends(get_current_user)):
    items = await db.habits.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    today = today_str()
    for h in items:
        h["completed_today"] = today in h.get("completions", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.post("/habits")
async def create_habit(body: HabitIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "description": body.description or "",
        "frequency": body.frequency,
        "difficulty": body.difficulty,
        "custom_coins": body.custom_coins,
        "coins_per_completion": coins_for(body.difficulty, body.custom_coins),
        "icon": body.icon or "flame",
        "streak": 0,
        "longest_streak": 0,
        "last_completed_date": None,
        "completions": [],
        "total_completions": 0,
        "created_at": now_utc_iso(),
    }
    await db.habits.insert_one(doc)
    doc.pop("_id", None)
    doc["completed_today"] = False
    return doc


@api_router.put("/habits/{habit_id}")
async def update_habit(habit_id: str, body: HabitIn, user: dict = Depends(get_current_user)):
    update = {
        "name": body.name,
        "description": body.description or "",
        "frequency": body.frequency,
        "difficulty": body.difficulty,
        "custom_coins": body.custom_coins,
        "coins_per_completion": coins_for(body.difficulty, body.custom_coins),
        "icon": body.icon or "flame",
    }
    result = await db.habits.update_one({"id": habit_id, "user_id": user["id"]}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    updated = await db.habits.find_one({"id": habit_id}, {"_id": 0})
    updated["completed_today"] = today_str() in updated.get("completions", [])
    return updated


@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: dict = Depends(get_current_user)):
    result = await db.habits.delete_one({"id": habit_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"ok": True}


@api_router.post("/habits/{habit_id}/complete")
async def complete_habit(habit_id: str, user: dict = Depends(get_current_user)):
    habit = await db.habits.find_one({"id": habit_id, "user_id": user["id"]}, {"_id": 0})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    today = today_str()
    completions = habit.get("completions", [])
    if today in completions:
        raise HTTPException(status_code=400, detail="Already completed today")

    # streak calc
    last = habit.get("last_completed_date")
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    new_streak = 1
    if last == yesterday:
        new_streak = habit.get("streak", 0) + 1
    elif last == today:
        new_streak = habit.get("streak", 0)
    longest = max(habit.get("longest_streak", 0), new_streak)

    coins = habit.get("coins_per_completion") or coins_for(habit.get("difficulty"), habit.get("custom_coins"))
    completions.append(today)

    await db.habits.update_one(
        {"id": habit_id},
        {
            "$set": {
                "completions": completions,
                "last_completed_date": today,
                "streak": new_streak,
                "longest_streak": longest,
            },
            "$inc": {"total_completions": 1},
        },
    )
    new_balance = user.get("coin_balance", 0) + coins
    await db.users.update_one({"id": user["id"]}, {"$set": {"coin_balance": new_balance}})
    await log_transaction(user["id"], coins, "earn", "habit", habit_id, f"Completed habit: {habit['name']}")

    updated = await db.habits.find_one({"id": habit_id}, {"_id": 0})
    updated["completed_today"] = True
    return {"habit": updated, "coins_earned": coins, "new_balance": new_balance, "streak": new_streak}


# ============== Tasks ==============
@api_router.get("/tasks")
async def list_tasks(user: dict = Depends(get_current_user)):
    items = await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    # Pending first, then by created_at desc
    items.sort(key=lambda x: (x.get("completed", False), x.get("created_at", "")), reverse=False)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    items.sort(key=lambda x: x.get("completed", False))
    return items


@api_router.post("/tasks")
async def create_task(body: TaskIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "description": body.description or "",
        "difficulty": body.difficulty,
        "custom_coins": body.custom_coins,
        "coins_reward": coins_for(body.difficulty, body.custom_coins),
        "due_date": body.due_date,
        "completed": False,
        "completed_at": None,
        "created_at": now_utc_iso(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, body: TaskIn, user: dict = Depends(get_current_user)):
    update = {
        "name": body.name,
        "description": body.description or "",
        "difficulty": body.difficulty,
        "custom_coins": body.custom_coins,
        "coins_reward": coins_for(body.difficulty, body.custom_coins),
        "due_date": body.due_date,
    }
    result = await db.tasks.update_one({"id": task_id, "user_id": user["id"]}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.get("completed"):
        raise HTTPException(status_code=400, detail="Task already completed")
    coins = task.get("coins_reward") or coins_for(task.get("difficulty"), task.get("custom_coins"))
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": True, "completed_at": now_utc_iso()}},
    )
    new_balance = user.get("coin_balance", 0) + coins
    await db.users.update_one({"id": user["id"]}, {"$set": {"coin_balance": new_balance}})
    await log_transaction(user["id"], coins, "earn", "task", task_id, f"Completed task: {task['name']}")
    return {"coins_earned": coins, "new_balance": new_balance}


@api_router.post("/tasks/{task_id}/uncomplete")
async def uncomplete_task(task_id: str, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.get("completed"):
        raise HTTPException(status_code=400, detail="Task not completed")
    coins = task.get("coins_reward") or coins_for(task.get("difficulty"), task.get("custom_coins"))
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": False, "completed_at": None}},
    )
    new_balance = max(0, user.get("coin_balance", 0) - coins)
    await db.users.update_one({"id": user["id"]}, {"$set": {"coin_balance": new_balance}})
    await log_transaction(user["id"], -coins, "spend", "task_undo", task_id, f"Un-completed task: {task['name']}")
    return {"coins_refunded": -coins, "new_balance": new_balance}


# ============== Rewards ==============
@api_router.get("/rewards")
async def list_rewards(user: dict = Depends(get_current_user)):
    items = await db.rewards.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.post("/rewards")
async def create_reward(body: RewardIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "description": body.description or "",
        "cost": int(body.cost),
        "icon": body.icon or "gift",
        "times_redeemed": 0,
        "created_at": now_utc_iso(),
    }
    await db.rewards.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/rewards/{reward_id}")
async def update_reward(reward_id: str, body: RewardIn, user: dict = Depends(get_current_user)):
    result = await db.rewards.update_one(
        {"id": reward_id, "user_id": user["id"]},
        {"$set": {"name": body.name, "description": body.description or "", "cost": int(body.cost), "icon": body.icon or "gift"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return await db.rewards.find_one({"id": reward_id}, {"_id": 0})


@api_router.delete("/rewards/{reward_id}")
async def delete_reward(reward_id: str, user: dict = Depends(get_current_user)):
    result = await db.rewards.delete_one({"id": reward_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"ok": True}


@api_router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(reward_id: str, user: dict = Depends(get_current_user)):
    reward = await db.rewards.find_one({"id": reward_id, "user_id": user["id"]}, {"_id": 0})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    cost = int(reward["cost"])
    balance = user.get("coin_balance", 0)
    if balance < cost:
        raise HTTPException(status_code=400, detail=f"Not enough coins. Need {cost - balance} more.")
    new_balance = balance - cost
    await db.users.update_one({"id": user["id"]}, {"$set": {"coin_balance": new_balance}})
    await db.rewards.update_one({"id": reward_id}, {"$inc": {"times_redeemed": 1}})
    redemption = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "reward_id": reward_id,
        "reward_name": reward["name"],
        "reward_icon": reward.get("icon", "gift"),
        "cost": cost,
        "redeemed_at": now_utc_iso(),
    }
    await db.redemptions.insert_one(redemption)
    redemption.pop("_id", None)
    await log_transaction(user["id"], -cost, "spend", "reward", reward_id, f"Redeemed: {reward['name']}")
    return {"redemption": redemption, "new_balance": new_balance}


@api_router.get("/redemptions")
async def list_redemptions(user: dict = Depends(get_current_user)):
    items = await db.redemptions.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("redeemed_at", ""), reverse=True)
    return items


# ============== Transactions / Stats ==============
@api_router.get("/transactions")
async def list_transactions(user: dict = Depends(get_current_user)):
    items = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    uid = user["id"]
    habits_count = await db.habits.count_documents({"user_id": uid})
    tasks_total = await db.tasks.count_documents({"user_id": uid})
    tasks_done = await db.tasks.count_documents({"user_id": uid, "completed": True})
    rewards_count = await db.rewards.count_documents({"user_id": uid})
    redemptions_count = await db.redemptions.count_documents({"user_id": uid})

    # total earned
    pipe = [
        {"$match": {"user_id": uid, "type": "earn"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    earn_agg = await db.transactions.aggregate(pipe).to_list(1)
    total_earned = earn_agg[0]["total"] if earn_agg else 0

    # best streak
    habits = await db.habits.find({"user_id": uid}, {"_id": 0, "streak": 1, "longest_streak": 1}).to_list(1000)
    best_streak = max([h.get("longest_streak", 0) for h in habits], default=0)
    current_max_streak = max([h.get("streak", 0) for h in habits], default=0)

    return {
        "coin_balance": user.get("coin_balance", 0),
        "total_earned": total_earned,
        "habits_count": habits_count,
        "tasks_total": tasks_total,
        "tasks_done": tasks_done,
        "tasks_pending": tasks_total - tasks_done,
        "rewards_count": rewards_count,
        "redemptions_count": redemptions_count,
        "best_streak": best_streak,
        "current_max_streak": current_max_streak,
    }


# --- Health ---
@api_router.get("/")
async def root():
    return {"message": "Habit Quest API", "status": "ok"}


# --- Register router & CORS ---
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.habits.create_index("user_id")
    await db.tasks.create_index("user_id")
    await db.rewards.create_index("user_id")
    await db.redemptions.create_index("user_id")
    await db.transactions.create_index("user_id")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "coin_balance": 0,
            "created_at": now_utc_iso(),
        })
        logger.info(f"Seeded admin user: {admin_email}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
