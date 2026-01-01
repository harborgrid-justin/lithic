/**
 * Tasks API
 * Endpoints for managing tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { Task, TaskStatus, TaskPriority } from "@/types/workflow";
import { taskManager } from "@/lib/workflow/task-manager";

/**
 * GET /api/workflow/tasks
 * List tasks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assignedTo");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const filters: any = {};
    if (status) filters.status = [status as TaskStatus];
    if (priority) filters.priority = [priority as TaskPriority];
    if (assignedTo) filters.assignedTo = assignedTo;

    const tasks = assignedTo
      ? taskManager.getTasksByAssignee(assignedTo, filters)
      : [];

    return NextResponse.json({
      success: true,
      data: tasks,
      meta: {
        total: tasks.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch tasks",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflow/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const task = await taskManager.createTask({
      ...body,
      organizationId: body.organizationId || "default",
    });

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Invalid task data",
        },
      },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/workflow/tasks
 * Update task status or assignment
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    let task;

    switch (action) {
      case "assign":
        task = await taskManager.assignTask(id, data.userId, data.assignedBy);
        break;

      case "start":
        task = await taskManager.startTask(id, data.userId);
        break;

      case "complete":
        task = await taskManager.completeTask(id, data.userId, data.output);
        break;

      case "cancel":
        task = await taskManager.cancelTask(id, data.userId, data.reason);
        break;

      case "update_priority":
        task = await taskManager.updatePriority(id, data.priority, data.userId);
        break;

      case "update_checklist":
        task = await taskManager.updateChecklistItem(
          id,
          data.itemId,
          data.completed,
          data.userId
        );
        break;

      case "add_comment":
        taskManager.addComment(id, {
          authorId: data.userId,
          authorName: data.userName,
          text: data.text,
          isInternal: data.isInternal || false,
        });
        // Get updated task
        task = taskManager.getTasksByAssignee(data.userId).find((t) => t.id === id);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_ACTION",
              message: "Invalid action specified",
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to update task",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflow/tasks
 * Delete a task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Task ID and User ID are required",
          },
        },
        { status: 400 }
      );
    }

    await taskManager.cancelTask(id, userId, "Deleted by user");

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete task",
        },
      },
      { status: 500 }
    );
  }
}
