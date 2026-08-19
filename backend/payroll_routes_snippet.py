import datetime
import uuid
import calendar
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel

# ==========================================
# PAYROLL & HR MODULE MODELS
# ==========================================

class EmployeeIn(BaseModel):
    user_id: Optional[str] = None
    full_name: str
    designation: str
    department: str
    joining_date: str
    employment_type: Literal["Full-Time", "Part-Time", "Contract"]
    bank_name: Optional[str] = ""
    bank_account: Optional[str] = ""
    ifsc_code: Optional[str] = ""
    pan_number: Optional[str] = ""
    uan_number: Optional[str] = ""
    status: Literal["Active", "Inactive"] = "Active"

class SalaryStructureIn(BaseModel):
    wage_type: Literal["Fixed", "Hourly"] = "Fixed"
    basic_salary: float = 0
    hra: float = 0
    conveyance: float = 0
    medical: float = 0
    special_allowance: float = 0
    pf_deduction: float = 0
    esi_deduction: float = 0
    professional_tax: float = 0
    hourly_rate: float = 0

class AttendanceRecordIn(BaseModel):
    employee_id: str
    date: str  # YYYY-MM-DD
    status: Literal["Present", "Absent", "Half-Day", "Leave", "Holiday"]
    overtime_hours: float = 0
    late_mark: bool = False

class AttendanceBulkIn(BaseModel):
    records: List[AttendanceRecordIn]

class LoanIn(BaseModel):
    employee_id: str
    loan_amount: float
    emi_amount: float
    reason: str

class PayrollProcessIn(BaseModel):
    month: int
    year: int

class PayrollStatusUpdate(BaseModel):
    status: Literal["Draft", "Approved", "Paid"]
    payment_mode: Optional[str] = None
    transaction_id: Optional[str] = None

# ==========================================
# PAYROLL & HR MODULE API ROUTES
# ==========================================

@api.get("/payroll/dashboard")
async def get_payroll_dashboard(_=Depends(require_roles("admin"))):
    active_emps = await db.employees.count_documents({"status": "Active"})
    
    now = datetime.datetime.now()
    month, year = now.month, now.year
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1

    last_payroll = await db.payrolls.find_one({"month": prev_month, "year": prev_year})
    last_cost = last_payroll.get("total_net_pay", 0) if last_payroll else 0
    pending_payouts = await db.payrolls.count_documents({"status": {"$in": ["Draft", "Approved"]}})
    
    return {
        "active_employees": active_emps,
        "last_month_cost": last_cost,
        "pending_payouts": pending_payouts
    }

@api.get("/payroll/employees")
async def get_employees(_=Depends(require_roles("admin"))):
    emps = await db.employees.find().to_list(None)
    return [{"id": e["id"], **{k:v for k,v in e.items() if k != "_id" and k != "id"}} for e in emps]

@api.post("/payroll/employees")
async def create_employee(body: EmployeeIn, _=Depends(require_roles("admin"))):
    emp = {"id": str(uuid.uuid4()), "created_at": iso(now_utc()), **body.model_dump()}
    await db.employees.insert_one(emp)
    # create empty salary structure
    await db.employees_salary_structure.insert_one({
        "id": str(uuid.uuid4()), "employee_id": emp["id"], 
        "wage_type": "Fixed", "basic_salary": 0, "hra": 0, "conveyance": 0, "medical": 0, "special_allowance": 0,
        "pf_deduction": 0, "esi_deduction": 0, "professional_tax": 0, "hourly_rate": 0
    })
    return {"status": "success", "id": emp["id"]}

@api.put("/payroll/employees/{emp_id}")
async def update_employee(emp_id: str, body: EmployeeIn, _=Depends(require_roles("admin"))):
    await db.employees.update_one({"id": emp_id}, {"$set": body.model_dump()})
    return {"status": "success"}

@api.get("/payroll/employees/{emp_id}/structure")
async def get_salary_structure(emp_id: str, _=Depends(require_roles("admin"))):
    struct = await db.employees_salary_structure.find_one({"employee_id": emp_id}, {"_id": 0})
    if not struct:
        raise HTTPException(404, "Structure not found")
    return struct

@api.put("/payroll/employees/{emp_id}/structure")
async def update_salary_structure(emp_id: str, body: SalaryStructureIn, _=Depends(require_roles("admin"))):
    await db.employees_salary_structure.update_one({"employee_id": emp_id}, {"$set": body.model_dump()}, upsert=True)
    return {"status": "success"}

@api.get("/payroll/attendance")
async def get_attendance(date: str, _=Depends(require_roles("admin"))):
    records = await db.attendance_records.find({"date": date}, {"_id": 0}).to_list(None)
    return records

@api.post("/payroll/attendance")
async def save_attendance(body: AttendanceBulkIn, _=Depends(require_roles("admin"))):
    for rec in body.records:
        await db.attendance_records.update_one(
            {"employee_id": rec.employee_id, "date": rec.date},
            {"$set": rec.model_dump()},
            upsert=True
        )
    return {"status": "success"}

@api.get("/payroll/loans")
async def get_loans(_=Depends(require_roles("admin"))):
    loans = await db.employee_loans.find({}, {"_id": 0}).to_list(None)
    for l in loans:
        emp = await db.employees.find_one({"id": l["employee_id"]})
        l["employee_name"] = emp["full_name"] if emp else "Unknown"
    return loans

@api.post("/payroll/loans")
async def create_loan(body: LoanIn, _=Depends(require_roles("admin"))):
    loan = {"id": str(uuid.uuid4()), "created_at": iso(now_utc()), "balance": body.loan_amount, **body.model_dump()}
    await db.employee_loans.insert_one(loan)
    return {"status": "success"}

@api.get("/payroll/runs")
async def get_payrolls(_=Depends(require_roles("admin"))):
    runs = await db.payrolls.find({}, {"_id": 0}).sort("created_at", -1).to_list(None)
    return runs

@api.get("/payroll/runs/{run_id}")
async def get_payroll_details(run_id: str, _=Depends(require_roles("admin"))):
    run = await db.payrolls.find_one({"id": run_id}, {"_id": 0})
    if not run: raise HTTPException(404, "Run not found")
    items = await db.payroll_items.find({"payroll_id": run_id}, {"_id": 0}).to_list(None)
    return {"run": run, "items": items}

@api.post("/payroll/process")
async def process_payroll(body: PayrollProcessIn, user=Depends(require_roles("admin"))):
    existing = await db.payrolls.find_one({"month": body.month, "year": body.year})
    if existing and existing["status"] != "Draft":
        raise HTTPException(400, "Payroll for this month is already approved/paid.")
    
    # Calculate days in month
    _, total_days = calendar.monthrange(body.year, body.month)
    start_date = f"{body.year}-{body.month:02d}-01"
    end_date = f"{body.year}-{body.month:02d}-{total_days}"

    emps = await db.employees.find({"status": "Active"}).to_list(None)
    items = []
    total_net = 0

    for emp in emps:
        struct = await db.employees_salary_structure.find_one({"employee_id": emp["id"]})
        if not struct: continue

        # Get attendance
        att_records = await db.attendance_records.find({
            "employee_id": emp["id"],
            "date": {"$gte": start_date, "$lte": end_date}
        }).to_list(None)

        present = sum(1 for r in att_records if r["status"] == "Present")
        half_days = sum(1 for r in att_records if r["status"] == "Half-Day")
        holidays = sum(1 for r in att_records if r["status"] == "Holiday")
        leaves = sum(1 for r in att_records if r["status"] == "Leave")
        
        # Calculate working days credit
        days_credited = present + (half_days * 0.5) + holidays + leaves
        
        gross = 0
        basic = struct.get("basic_salary", 0)
        
        if struct.get("wage_type") == "Fixed":
            # Prorate fixed salary based on days credited vs total days
            prorate_factor = days_credited / total_days if total_days > 0 else 0
            gross = (basic + struct.get("hra", 0) + struct.get("conveyance", 0) + struct.get("medical", 0) + struct.get("special_allowance", 0)) * prorate_factor
        else:
            # Hourly wage
            overtime = sum(r.get("overtime_hours", 0) for r in att_records)
            gross = (overtime * struct.get("hourly_rate", 0)) # assuming basic represents base hours, needs proper hourly tracking but simplifying for now.

        deductions = struct.get("pf_deduction", 0) + struct.get("esi_deduction", 0) + struct.get("professional_tax", 0)
        
        # Loan EMI deduction
        loan_deduction = 0
        active_loans = await db.employee_loans.find({"employee_id": emp["id"], "balance": {"$gt": 0}}).to_list(None)
        for loan in active_loans:
            emi = min(loan["emi_amount"], loan["balance"])
            loan_deduction += emi

        total_deductions = deductions + loan_deduction
        net_pay = max(0, gross - total_deductions)

        item = {
            "id": str(uuid.uuid4()),
            "employee_id": emp["id"],
            "employee_name": emp["full_name"],
            "days_credited": days_credited,
            "gross_pay": gross,
            "deductions": total_deductions,
            "loan_deduction": loan_deduction,
            "net_pay": net_pay
        }
        items.append(item)
        total_net += net_pay

    if existing:
        await db.payroll_items.delete_many({"payroll_id": existing["id"]})
        run_id = existing["id"]
        await db.payrolls.update_one({"id": run_id}, {"$set": {"total_net_pay": total_net, "employee_count": len(items), "updated_at": iso(now_utc())}})
    else:
        run_id = str(uuid.uuid4())
        await db.payrolls.insert_one({
            "id": run_id, "month": body.month, "year": body.year, 
            "status": "Draft", "total_net_pay": total_net, "employee_count": len(items),
            "created_at": iso(now_utc()), "created_by": user.get("email")
        })

    for it in items:
        it["payroll_id"] = run_id
    if items:
        await db.payroll_items.insert_many(items)

    return {"status": "success", "run_id": run_id}

@api.patch("/payroll/runs/{run_id}/status")
async def update_payroll_status(run_id: str, body: PayrollStatusUpdate, user=Depends(require_roles("admin"))):
    run = await db.payrolls.find_one({"id": run_id})
    if not run: raise HTTPException(404, "Run not found")

    update_data = {"status": body.status, "updated_at": iso(now_utc())}
    if body.status == "Paid":
        update_data["payment_mode"] = body.payment_mode
        update_data["transaction_id"] = body.transaction_id
        update_data["paid_at"] = iso(now_utc())

        # deduct loan balances
        items = await db.payroll_items.find({"payroll_id": run_id}).to_list(None)
        for item in items:
            if item.get("loan_deduction", 0) > 0:
                # Find active loan and reduce balance
                active_loan = await db.employee_loans.find_one({"employee_id": item["employee_id"], "balance": {"$gt": 0}})
                if active_loan:
                    await db.employee_loans.update_one({"id": active_loan["id"]}, {"$inc": {"balance": -item["loan_deduction"]}})
                    await db.loan_repayments.insert_one({
                        "id": str(uuid.uuid4()), "loan_id": active_loan["id"], "payroll_id": run_id, 
                        "amount": item["loan_deduction"], "date": iso(now_utc())
                    })

    await db.payrolls.update_one({"id": run_id}, {"$set": update_data})
    
    await db.payroll_audit_logs.insert_one({
        "id": str(uuid.uuid4()), "payroll_id": run_id, "status": body.status,
        "changed_by": user.get("email"), "timestamp": iso(now_utc())
    })
    return {"status": "success"}

@api.get("/payroll/payslip/{item_id}")
async def get_payslip(item_id: str, _=Depends(require_roles("admin"))):
    item = await db.payroll_items.find_one({"id": item_id}, {"_id": 0})
    if not item: raise HTTPException(404, "Payslip not found")
    emp = await db.employees.find_one({"id": item["employee_id"]}, {"_id": 0})
    run = await db.payrolls.find_one({"id": item["payroll_id"]}, {"_id": 0})
    struct = await db.employees_salary_structure.find_one({"employee_id": item["employee_id"]}, {"_id": 0})
    
    return {"item": item, "employee": emp, "payroll": run, "structure": struct}

