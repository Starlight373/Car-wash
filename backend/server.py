from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'carwash-pos-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    KASIR = "kasir"
    TEKNISI = "teknisi"

class MembershipType(str, Enum):
    REGULAR = "regular"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    BIANNUAL = "biannual"
    ANNUAL = "annual"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    QR = "qr"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class ShiftOpen(BaseModel):
    kasir_id: str
    opening_balance: float

class ShiftClose(BaseModel):
    shift_id: str
    closing_balance: float
    notes: Optional[str] = None

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kasir_id: str
    kasir_name: str
    opening_balance: float
    closing_balance: Optional[float] = None
    expected_balance: Optional[float] = None
    variance: Optional[float] = None
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    status: str = "open"  # open, closed
    notes: Optional[str] = None

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    join_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_visits: int = 0
    total_spending: float = 0.0

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None

class Membership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    membership_type: MembershipType
    start_date: datetime
    end_date: datetime
    status: MembershipStatus
    usage_count: int = 0
    last_used: Optional[datetime] = None
    price: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MembershipCreate(BaseModel):
    customer_id: str
    membership_type: MembershipType
    price: float
    notes: Optional[str] = None

class MembershipUsage(BaseModel):
    phone: str
    service_id: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str  # exterior, interior, detailing, etc
    is_active: bool = True

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str
    name: str
    category: str  # chemicals, supplies, equipment_parts
    unit: str  # liter, kg, pcs
    current_stock: float
    min_stock: float
    max_stock: float
    unit_cost: float  # HPP
    supplier: Optional[str] = None
    last_purchase_date: Optional[datetime] = None
    is_active: bool = True

class InventoryItemCreate(BaseModel):
    sku: str
    name: str
    category: str
    unit: str
    current_stock: float
    min_stock: float
    max_stock: float
    unit_cost: float
    supplier: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None
    is_active: Optional[bool] = None

# BOM (Bill of Materials) for services
class BOMItem(BaseModel):
    inventory_id: str
    inventory_name: str
    quantity: float
    unit: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str  # exterior, interior, detailing, etc
    is_active: bool = True
    bom: Optional[List[dict]] = []  # Bill of Materials

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str
    bom: Optional[List[dict]] = []

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    bom: Optional[List[dict]] = None

# Physical Products (for sale)
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    category: str
    inventory_id: Optional[str] = None  # Link to inventory
    is_active: bool = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    inventory_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    inventory_id: Optional[str] = None
    is_active: Optional[bool] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    kasir_id: str
    kasir_name: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    shift_id: str
    items: List[dict]
    subtotal: float
    total: float
    payment_method: PaymentMethod
    payment_received: float
    change_amount: float
    cogs: float = 0.0
    gross_margin: float = 0.0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    customer_id: Optional[str] = None
    items: List[dict]
    payment_method: PaymentMethod
    payment_received: float
    notes: Optional[str] = None

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes - Authentication
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_dict = user_data.model_dump(exclude={'password'})
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user_doc = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get('is_active', True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    user_doc.pop('password_hash', None)
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    token = create_token(user.id, user.role.value)
    
    return LoginResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Routes - Users
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

# Routes - Shifts
@api_router.post("/shifts/open", response_model=Shift)
async def open_shift(shift_data: ShiftOpen, current_user: User = Depends(get_current_user)):
    # Check if there's an open shift for this kasir
    existing = await db.shifts.find_one({"kasir_id": shift_data.kasir_id, "status": "open"}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Shift already open for this kasir")
    
    shift = Shift(
        kasir_id=shift_data.kasir_id,
        kasir_name=current_user.full_name,
        opening_balance=shift_data.opening_balance
    )
    
    doc = shift.model_dump()
    doc['opened_at'] = doc['opened_at'].isoformat()
    
    await db.shifts.insert_one(doc)
    return shift

@api_router.post("/shifts/close", response_model=Shift)
async def close_shift(shift_data: ShiftClose, current_user: User = Depends(get_current_user)):
    shift_doc = await db.shifts.find_one({"id": shift_data.shift_id}, {"_id": 0})
    if not shift_doc:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if shift_doc['status'] == 'closed':
        raise HTTPException(status_code=400, detail="Shift already closed")
    
    # Calculate expected balance
    transactions = await db.transactions.find({"shift_id": shift_data.shift_id}).to_list(1000)
    cash_transactions = [t for t in transactions if t.get('payment_method') == 'cash']
    total_cash = sum(t.get('total', 0) for t in cash_transactions)
    expected_balance = shift_doc['opening_balance'] + total_cash
    variance = shift_data.closing_balance - expected_balance
    
    shift_doc['closing_balance'] = shift_data.closing_balance
    shift_doc['expected_balance'] = expected_balance
    shift_doc['variance'] = variance
    shift_doc['closed_at'] = datetime.now(timezone.utc).isoformat()
    shift_doc['status'] = 'closed'
    shift_doc['notes'] = shift_data.notes
    
    await db.shifts.update_one({"id": shift_data.shift_id}, {"$set": shift_doc})
    
    if isinstance(shift_doc.get('opened_at'), str):
        shift_doc['opened_at'] = datetime.fromisoformat(shift_doc['opened_at'])
    if isinstance(shift_doc.get('closed_at'), str):
        shift_doc['closed_at'] = datetime.fromisoformat(shift_doc['closed_at'])
    
    return Shift(**shift_doc)

@api_router.get("/shifts/current/{kasir_id}")
async def get_current_shift(kasir_id: str, current_user: User = Depends(get_current_user)):
    shift = await db.shifts.find_one({"kasir_id": kasir_id, "status": "open"}, {"_id": 0})
    if not shift:
        return None
    
    if isinstance(shift.get('opened_at'), str):
        shift['opened_at'] = datetime.fromisoformat(shift['opened_at'])
    
    return shift

@api_router.get("/shifts", response_model=List[Shift])
async def get_shifts(current_user: User = Depends(get_current_user)):
    shifts = await db.shifts.find({}, {"_id": 0}).sort("opened_at", -1).to_list(100)
    for shift in shifts:
        if isinstance(shift.get('opened_at'), str):
            shift['opened_at'] = datetime.fromisoformat(shift['opened_at'])
        if isinstance(shift.get('closed_at'), str):
            shift['closed_at'] = datetime.fromisoformat(shift['closed_at'])
    return shifts

# Routes - Customers
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer = Customer(**customer_data.model_dump())
    doc = customer.model_dump()
    doc['join_date'] = doc['join_date'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get('join_date'), str):
            customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer.get('join_date'), str):
        customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerUpdate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = {k: v for k, v in customer_data.model_dump().items() if v is not None}
    if update_data:
        await db.customers.update_one({"id": customer_id}, {"$set": update_data})
        customer.update(update_data)
    
    if isinstance(customer.get('join_date'), str):
        customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    
    return Customer(**customer)

@api_router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str, current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"customer_id": customer_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    
    return transactions

# Routes - Memberships
@api_router.post("/memberships", response_model=Membership)
async def create_membership(membership_data: MembershipCreate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": membership_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate end date based on membership type
    start_date = datetime.now(timezone.utc)
    days_map = {
        MembershipType.MONTHLY: 30,
        MembershipType.QUARTERLY: 90,
        MembershipType.BIANNUAL: 180,
        MembershipType.ANNUAL: 365,
        MembershipType.REGULAR: 0
    }
    
    days = days_map[membership_data.membership_type]
    end_date = start_date + timedelta(days=days) if days > 0 else start_date + timedelta(days=3650)  # 10 years for regular
    
    membership = Membership(
        customer_id=membership_data.customer_id,
        customer_name=customer['name'],
        membership_type=membership_data.membership_type,
        start_date=start_date,
        end_date=end_date,
        status=MembershipStatus.ACTIVE,
        price=membership_data.price
    )
    
    doc = membership.model_dump()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.memberships.insert_one(doc)
    return membership

@api_router.get("/memberships", response_model=List[Membership])
async def get_memberships(current_user: User = Depends(get_current_user)):
    memberships = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    now = datetime.now(timezone.utc)
    
    for membership in memberships:
        if isinstance(membership.get('start_date'), str):
            membership['start_date'] = datetime.fromisoformat(membership['start_date'])
        if isinstance(membership.get('end_date'), str):
            membership['end_date'] = datetime.fromisoformat(membership['end_date'])
        if isinstance(membership.get('created_at'), str):
            membership['created_at'] = datetime.fromisoformat(membership['created_at'])
        if isinstance(membership.get('last_used'), str):
            membership['last_used'] = datetime.fromisoformat(membership['last_used'])
        
        # Update status based on expiry
        if membership['end_date'] < now:
            membership['status'] = MembershipStatus.EXPIRED
        elif (membership['end_date'] - now).days <= 7:
            membership['status'] = MembershipStatus.EXPIRING_SOON
        else:
            membership['status'] = MembershipStatus.ACTIVE
    
    return memberships

# Routes - Services
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    service = Service(**service_data.model_dump())
    doc = service.model_dump()
    await db.services.insert_one(doc)
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(current_user: User = Depends(get_current_user)):
    services = await db.services.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return services

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceUpdate, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    if update_data:
        await db.services.update_one({"id": service_id}, {"$set": update_data})
        service.update(update_data)
    
    return Service(**service)

# Routes - Products
@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return products

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
        product.update(update_data)
    
    return Product(**product)

# Routes - Inventory
@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: User = Depends(get_current_user)):
    item = InventoryItem(**item_data.model_dump())
    doc = item.model_dump()
    await db.inventory.insert_one(doc)
    return item

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: User = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('last_purchase_date'), str):
            item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    return items

@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str, current_user: User = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if isinstance(item.get('last_purchase_date'), str):
        item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    return item

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item_data: InventoryItemUpdate, current_user: User = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if update_data:
        await db.inventory.update_one({"id": item_id}, {"$set": update_data})
        item.update(update_data)
    
    if isinstance(item.get('last_purchase_date'), str):
        item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    
    return InventoryItem(**item)

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: User = Depends(get_current_user)):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.get("/inventory/low-stock")
async def get_low_stock(current_user: User = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    low_stock = [item for item in items if item['current_stock'] <= item['min_stock']]
    return low_stock

# Routes - Transactions
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Get current shift
    shift = await db.shifts.find_one({"kasir_id": current_user.id, "status": "open"}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=400, detail="No open shift. Please open a shift first.")
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in transaction_data.items)
    total = subtotal
    change_amount = transaction_data.payment_received - total
    
    if change_amount < 0:
        raise HTTPException(status_code=400, detail="Payment received is less than total")
    
    # Get customer name if customer_id provided
    customer_name = None
    if transaction_data.customer_id:
        customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
        if customer:
            customer_name = customer['name']
    
    # Generate invoice number
    today = datetime.now(timezone.utc)
    invoice_prefix = today.strftime("%Y%m%d")
    last_invoice = await db.transactions.find_one(
        {"invoice_number": {"$regex": f"^INV-{invoice_prefix}"}},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if last_invoice:
        last_num = int(last_invoice['invoice_number'].split('-')[-1])
        invoice_number = f"INV-{invoice_prefix}-{str(last_num + 1).zfill(4)}"
    else:
        invoice_number = f"INV-{invoice_prefix}-0001"
    
    transaction = Transaction(
        invoice_number=invoice_number,
        kasir_id=current_user.id,
        kasir_name=current_user.full_name,
        customer_id=transaction_data.customer_id,
        customer_name=customer_name,
        shift_id=shift['id'],
        items=transaction_data.items,
        subtotal=subtotal,
        total=total,
        payment_method=transaction_data.payment_method,
        payment_received=transaction_data.payment_received,
        change_amount=change_amount,
        notes=transaction_data.notes
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.transactions.insert_one(doc)
    
    # Update customer stats if customer_id provided
    if transaction_data.customer_id:
        await db.customers.update_one(
            {"id": transaction_data.customer_id},
            {"$inc": {"total_visits": 1, "total_spending": total}}
        )
    
    return transaction

@api_router.get("/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for transaction in transactions:
        if isinstance(transaction.get('created_at'), str):
            transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transactions

@api_router.get("/transactions/today")
async def get_today_transactions(current_user: User = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    transactions = await db.transactions.find(
        {"created_at": {"$gte": today_start.isoformat()}},
        {"_id": 0}
    ).to_list(1000)
    
    for transaction in transactions:
        if isinstance(transaction.get('created_at'), str):
            transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    
    return transactions

# Routes - Dashboard
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's transactions
    today_transactions = await db.transactions.find(
        {"created_at": {"$gte": today_start.isoformat()}}
    ).to_list(1000)
    
    today_revenue = sum(t.get('total', 0) for t in today_transactions)
    today_count = len(today_transactions)
    
    # Active memberships
    now = datetime.now(timezone.utc)
    all_memberships = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    active_count = 0
    expiring_count = 0
    
    for m in all_memberships:
        end_date = datetime.fromisoformat(m['end_date']) if isinstance(m['end_date'], str) else m['end_date']
        if end_date >= now:
            active_count += 1
            if (end_date - now).days <= 7:
                expiring_count += 1
    
    # Low stock items
    low_stock_items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    low_stock_count = sum(1 for item in low_stock_items if item['current_stock'] <= item['min_stock'])
    
    # Kasir performance today
    kasir_performance = {}
    for t in today_transactions:
        kasir_name = t.get('kasir_name', 'Unknown')
        if kasir_name not in kasir_performance:
            kasir_performance[kasir_name] = {'count': 0, 'revenue': 0}
        kasir_performance[kasir_name]['count'] += 1
        kasir_performance[kasir_name]['revenue'] += t.get('total', 0)
    
    return {
        "today_revenue": today_revenue,
        "today_transactions": today_count,
        "active_memberships": active_count,
        "expiring_memberships": expiring_count,
        "low_stock_items": low_stock_count,
        "kasir_performance": kasir_performance
    }

# Public Routes (No Authentication Required)
@api_router.post("/public/check-membership")
async def check_membership_public(phone: str):
    """Public endpoint untuk customer cek membership mereka"""
    customer = await db.customers.find_one({"phone": phone}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Nomor telepon tidak ditemukan")
    
    # Get memberships for this customer
    memberships = await db.memberships.find({"customer_id": customer['id']}, {"_id": 0}).to_list(100)
    
    now = datetime.now(timezone.utc)
    result_memberships = []
    
    for m in memberships:
        if isinstance(m.get('start_date'), str):
            m['start_date'] = datetime.fromisoformat(m['start_date'])
        if isinstance(m.get('end_date'), str):
            m['end_date'] = datetime.fromisoformat(m['end_date'])
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
        if isinstance(m.get('last_used'), str):
            m['last_used'] = datetime.fromisoformat(m['last_used'])
        
        # Update status
        if m['end_date'] < now:
            m['status'] = MembershipStatus.EXPIRED
        elif (m['end_date'] - now).days <= 7:
            m['status'] = MembershipStatus.EXPIRING_SOON
        else:
            m['status'] = MembershipStatus.ACTIVE
        
        # Calculate days remaining
        days_remaining = (m['end_date'] - now).days
        m['days_remaining'] = days_remaining if days_remaining > 0 else 0
        
        result_memberships.append(m)
    
    return {
        "customer": customer,
        "memberships": result_memberships
    }

@api_router.get("/public/services")
async def get_public_services():
    """Public endpoint untuk menampilkan services di landing page"""
    services = await db.services.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return services

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()