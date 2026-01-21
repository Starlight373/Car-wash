import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from datetime import datetime, timezone
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    print("🌱 Starting data seeding...")
    
    # Create admin user
    existing_admin = await db.users.find_one({"username": "admin"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "full_name": "Admin User",
            "email": "admin@washngo.com",
            "role": "owner",
            "phone": "081234567890",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created (username: admin, password: admin123)")
    else:
        print("ℹ️  Admin user already exists")
    
    # Create sample kasir users
    kasir_users = [
        {
            "id": str(uuid.uuid4()),
            "username": "kasir1",
            "password_hash": hash_password("kasir123"),
            "full_name": "Budi Santoso",
            "role": "kasir",
            "phone": "081234567891",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "kasir2",
            "password_hash": hash_password("kasir123"),
            "full_name": "Siti Rahayu",
            "role": "kasir",
            "phone": "081234567892",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for kasir in kasir_users:
        existing = await db.users.find_one({"username": kasir["username"]})
        if not existing:
            await db.users.insert_one(kasir)
            print(f"✅ Kasir user created: {kasir['username']}")
    
    # Create sample services
    services = [
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Small",
            "description": "Cuci body eksterior untuk mobil small (sedan, hatchback)",
            "price": 35000,
            "duration_minutes": 20,
            "category": "exterior",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Medium",
            "description": "Cuci body eksterior untuk mobil medium (SUV, MPV)",
            "price": 50000,
            "duration_minutes": 30,
            "category": "exterior",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Large",
            "description": "Cuci body eksterior untuk mobil large (minibus, pickup)",
            "price": 75000,
            "duration_minutes": 40,
            "category": "exterior",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Interior Basic",
            "description": "Vacuum dan lap interior basic",
            "price": 40000,
            "duration_minutes": 30,
            "category": "interior",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Interior Premium",
            "description": "Deep cleaning interior dengan shampooing",
            "price": 100000,
            "duration_minutes": 60,
            "category": "interior",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Waxing",
            "description": "Waxing untuk kilap maksimal",
            "price": 75000,
            "duration_minutes": 45,
            "category": "detailing",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Polish Body",
            "description": "Polish body untuk menghilangkan goresan ringan",
            "price": 150000,
            "duration_minutes": 90,
            "category": "polish",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nano Coating",
            "description": "Coating nano ceramic untuk proteksi maksimal",
            "price": 500000,
            "duration_minutes": 180,
            "category": "coating",
            "is_active": True
        }
    ]
    
    existing_services = await db.services.count_documents({})
    if existing_services == 0:
        await db.services.insert_many(services)
        print(f"✅ {len(services)} sample services created")
    else:
        print("ℹ️  Services already exist")
    
    # Create sample inventory
    inventory_items = [
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-001",
            "name": "Car Shampoo Premium",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 50,
            "min_stock": 10,
            "max_stock": 100,
            "unit_cost": 25000,
            "supplier": "PT Kimia Otomotif"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-002",
            "name": "Wax Premium",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 30,
            "min_stock": 5,
            "max_stock": 50,
            "unit_cost": 75000,
            "supplier": "PT Kimia Otomotif"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUPP-001",
            "name": "Microfiber Towel",
            "category": "supplies",
            "unit": "pcs",
            "current_stock": 100,
            "min_stock": 20,
            "max_stock": 200,
            "unit_cost": 15000,
            "supplier": "CV Tekstil Jaya"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUPP-002",
            "name": "Sponge Wash",
            "category": "supplies",
            "unit": "pcs",
            "current_stock": 50,
            "min_stock": 10,
            "max_stock": 100,
            "unit_cost": 8000,
            "supplier": "CV Tekstil Jaya"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-003",
            "name": "Tire Black",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 8,
            "min_stock": 10,
            "max_stock": 30,
            "unit_cost": 35000,
            "supplier": "PT Kimia Otomotif"
        }
    ]
    
    existing_inventory = await db.inventory.count_documents({})
    if existing_inventory == 0:
        await db.inventory.insert_many(inventory_items)
        print(f"✅ {len(inventory_items)} inventory items created")
    else:
        print("ℹ️  Inventory items already exist")
    
    print("🎉 Data seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_data())
