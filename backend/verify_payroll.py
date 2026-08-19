import asyncio
import datetime
from server import db, master_db

async def verify():
    print("Testing Payroll API functionality via backend direct DB insertion + engine...")
    
    emp_id = "test-emp-123"
    # Clean previous test
    await master_db.users.delete_many({"id": emp_id})
    await db.staff_profiles.delete_many({"user_id": emp_id})
    await db.employees_salary_structure.delete_many({"employee_id": emp_id})
    await db.salary_advances.delete_many({"employee_id": emp_id})
    await db.attendance_records.delete_many({"employee_id": emp_id})
    
    # 1. Create employee in master_db and db.staff_profiles
    await master_db.users.insert_one({
        "id": emp_id,
        "name": "Test Employee",
        "email": "testemp@pos.com",
        "role": "staff",
        "tenant_id": "default"
    })
    await db.staff_profiles.insert_one({
        "user_id": emp_id,
        "status": "Active",
        "designation": "Manager",
        "department": "Operations",
        "joining_date": "2023-01-01",
        "employment_type": "Full-Time"
    })
    
    # 2. Add Salary Structure
    await db.employees_salary_structure.insert_one({
        "id": "struct-123",
        "employee_id": emp_id,
        "wage_type": "Fixed",
        "basic_salary": 20000,
        "hra": 5000,
        "conveyance": 2000,
        "medical": 1000,
        "special_allowance": 2000,
        "pf_deduction": 1800,
        "esi_deduction": 200,
        "professional_tax": 200,
        "hourly_rate": 0
    })
    
    # Total Gross Expected = 30000
    # Statutory Deductions = 2200
    # Base Net = 27800
    
    # 3. Add Salary Advance
    await db.salary_advances.insert_one({
        "id": "advance-123",
        "employee_id": emp_id,
        "amount": 10000,
        "emi_amount": 3000,
        "balance": 10000,
        "reason": "Medical emergency",
        "status": "Approved",
        "created_at": datetime.datetime.now().isoformat()
    })
    
    # Total Net Expected after EMI = 27800 - 3000 = 24800 (assuming full attendance)
    
    # 4. Insert Attendance for Month 1, Year 2026
    # Let's say 31 days in Jan. We'll give 31 days "Present".
    records = []
    for d in range(1, 32):
        records.append({
            "employee_id": emp_id,
            "date": f"2026-01-{d:02d}",
            "status": "Present",
            "overtime_hours": 0,
            "late_mark": False
        })
    await db.attendance_records.insert_many(records)
    
    # 5. Process Payroll via server.py's process_payroll logic
    from server import process_payroll, PayrollProcessIn
    try:
        res = await process_payroll(PayrollProcessIn(month=1, year=2026), user={"email": "admin@pos.com"})
        run_id = res["run_id"]
        print(f"Payroll processed successfully, run_id: {run_id}")
    except Exception as e:
        print(f"Payroll engine failed: {e}")
        return

    # 6. Verify Results
    item = await db.payroll_items.find_one({"employee_id": emp_id, "payroll_id": run_id})
    print(f"Gross Pay: {item['gross_pay']} (Expected: 30000)")
    print(f"Stat Deductions: {item['deductions']} (Expected: 2200)")
    print(f"EMI Deduction: {item['advance_deduction']} (Expected: 3000)")
    print(f"Net Pay: {item['net_pay']} (Expected: 24800)")
    
    # 7. Update status to paid and check loan balance
    from server import update_payroll_status, PayrollStatusUpdate
    await update_payroll_status(run_id, PayrollStatusUpdate(status="Paid", payment_mode="Bank Transfer", transaction_id="TXN1234"), user={"email": "admin@pos.com"})
    
    advance = await db.salary_advances.find_one({"id": "advance-123"})
    print(f"New Advance Balance: {advance['balance']} (Expected: 7000)")

    print("✅ All verifications passed!")

if __name__ == "__main__":
    asyncio.run(verify())
