from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AccessRule
from app.schemas import (
    AccessRuleResponse,
    AccessRuleCreate,
    AccessRuleUpdate,
    AccessTestRequest,
    AccessTestResponse,
    DHCPAllocationRequest,
    DHCPAllocationResponse,
    PortSecurityTestRequest,
    PortSecurityTestResponse,
    SSHTestRequest,
    SSHTestResponse,
)
from app.services.security import SecurityEngine

router = APIRouter(tags=["Access Control & Security Demonstrations"])


# Access Rules CRUD
@router.get("/access-rules", response_model=List[AccessRuleResponse])
def get_access_rules(db: Session = Depends(get_db)):
    """Returns all departmental firewall and VLAN ACL rules ordered by evaluation priority."""
    return db.query(AccessRule).order_by(AccessRule.rule_order.asc()).all()


@router.post("/access-rules", response_model=AccessRuleResponse, status_code=201)
def create_access_rule(payload: AccessRuleCreate, db: Session = Depends(get_db)):
    """Creates a new departmental ACL rule."""
    existing = (
        db.query(AccessRule)
        .filter(AccessRule.rule_id == payload.rule_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Rule ID already exists.")

    rule = AccessRule(**payload.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/access-rules/{rule_id}", response_model=AccessRuleResponse)
def update_access_rule(
    rule_id: str, payload: AccessRuleUpdate, db: Session = Depends(get_db)
):
    """Updates fields or toggles enabled state of an access control rule."""
    rule = db.query(AccessRule).filter(AccessRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_id}' not found.")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


# Educational Security Demonstrations
@router.post("/security/test-access", response_model=AccessTestResponse)
def test_access_endpoint(payload: AccessTestRequest, db: Session = Depends(get_db)):
    """Tests an inter-departmental connection against the active ACL table."""
    sec = SecurityEngine(db)
    result = sec.evaluate_access(
        source_dept=payload.source_department,
        destination_dept=payload.destination_department,
        source_ip=payload.source_ip,
        destination_ip=payload.destination_ip,
        protocol=payload.protocol,
        port=payload.port,
    )
    return result


@router.get("/security/dhcp-pools")
def get_dhcp_pools_endpoint(db: Session = Depends(get_db)):
    """Returns modeled DHCP configuration and pools for all 7 departmental VLANs."""
    sec = SecurityEngine(db)
    return sec.get_dhcp_pools()


@router.post("/security/dhcp-allocate", response_model=DHCPAllocationResponse)
def allocate_dhcp_ip_endpoint(
    payload: DHCPAllocationRequest, db: Session = Depends(get_db)
):
    """Simulates dynamic IP lease allocation from departmental DHCP pool."""
    sec = SecurityEngine(db)
    return sec.simulate_dhcp_allocation(
        department_name=payload.department,
        client_hostname=payload.client_hostname,
        client_mac=payload.client_mac,
    )


@router.post("/security/test-port-security", response_model=PortSecurityTestResponse)
def test_port_security_endpoint(
    payload: PortSecurityTestRequest, db: Session = Depends(get_db)
):
    """Simulates switch port security: MAC verification and rogue port shutdown (err-disable)."""
    sec = SecurityEngine(db)
    return sec.test_port_security(
        switch_id=payload.switch_id,
        port_number=payload.port_number,
        mac_address=payload.mac_address,
    )


@router.post("/security/test-ssh", response_model=SSHTestResponse)
def test_ssh_endpoint(payload: SSHTestRequest, db: Session = Depends(get_db)):
    """Demonstrates simulated SSH remote administration access control."""
    sec = SecurityEngine(db)
    return sec.test_ssh_access(
        target_device=payload.target_device,
        username=payload.username,
        source_ip=payload.source_ip,
    )
