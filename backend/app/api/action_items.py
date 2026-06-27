"""
Action Items API Router
Full CRUD for action items across meetings.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import Meeting, ActionItem, generate_uuid, now
from app.schemas.schemas import ActionItemCreate, ActionItemUpdate, ApiResponse
from app.config import settings

router = APIRouter(tags=["action_items"])


def _get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    return x_user_id or settings.DEFAULT_USER_ID


@router.get("/meetings/{meeting_id}/action-items", response_model=ApiResponse)
async def list_action_items(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all action items for a meeting."""
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    result = await db.execute(
        select(ActionItem)
        .where(ActionItem.meeting_id == meeting_id)
        .order_by(ActionItem.created_at)
    )
    items = result.scalars().all()

    return ApiResponse(data=[
        {
            "id": a.id,
            "meeting_id": a.meeting_id,
            "text": a.text,
            "assignee": a.assignee,
            "due_date": a.due_date,
            "priority": a.priority,
            "status": a.status,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }
        for a in items
    ])


@router.post("/meetings/{meeting_id}/action-items", response_model=ApiResponse, status_code=201)
async def create_action_item(
    meeting_id: str,
    body: ActionItemCreate,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new action item for a meeting."""
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    item = ActionItem(
        id=generate_uuid(),
        meeting_id=meeting_id,
        text=body.text,
        assignee=body.assignee,
        due_date=body.due_date,
        priority=body.priority,
        status=body.status,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return ApiResponse(data={
        "id": item.id,
        "meeting_id": item.meeting_id,
        "text": item.text,
        "assignee": item.assignee,
        "due_date": item.due_date,
        "priority": item.priority,
        "status": item.status,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    })


@router.patch("/action-items/{item_id}", response_model=ApiResponse)
async def update_action_item(
    item_id: str,
    body: ActionItemUpdate,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update an action item's fields."""
    result = await db.execute(select(ActionItem).where(ActionItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    # Verify user owns the meeting
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == item.meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    if body.text is not None:
        item.text = body.text
    if body.assignee is not None:
        item.assignee = body.assignee
    if body.due_date is not None:
        item.due_date = body.due_date
    if body.priority is not None:
        item.priority = body.priority
    if body.status is not None:
        item.status = body.status

    item.updated_at = now()
    await db.commit()
    await db.refresh(item)

    return ApiResponse(data={
        "id": item.id,
        "meeting_id": item.meeting_id,
        "text": item.text,
        "assignee": item.assignee,
        "due_date": item.due_date,
        "priority": item.priority,
        "status": item.status,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    })


@router.delete("/action-items/{item_id}", status_code=204)
async def delete_action_item(
    item_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete an action item."""
    result = await db.execute(select(ActionItem).where(ActionItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == item.meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(item)
    await db.commit()


@router.get("/action-items", response_model=ApiResponse)
async def list_all_action_items(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all action items across all meetings for the user."""
    from sqlalchemy import and_
    
    # Get all meeting IDs for the user
    meetings_result = await db.execute(
        select(Meeting.id, Meeting.title).where(Meeting.user_id == user_id)
    )
    user_meetings = {row[0]: row[1] for row in meetings_result.all()}

    if not user_meetings:
        return ApiResponse(data=[])

    query = select(ActionItem).where(ActionItem.meeting_id.in_(user_meetings.keys()))

    if status:
        query = query.where(ActionItem.status == status)
    if priority:
        query = query.where(ActionItem.priority == priority)

    query = query.order_by(ActionItem.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return ApiResponse(data=[
        {
            "id": a.id,
            "meeting_id": a.meeting_id,
            "meeting_title": user_meetings.get(a.meeting_id, ""),
            "text": a.text,
            "assignee": a.assignee,
            "due_date": a.due_date,
            "priority": a.priority,
            "status": a.status,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }
        for a in items
    ])
