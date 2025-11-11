// app/actions.ts
"use client";

import { AuthContextProps } from "react-oidc-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Create a presigned URL for uploading a PDF
 */
export async function createUploadUrl(
  filename: string,
  session: AuthContextProps,
) {
  if (!session?.isAuthenticated) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user?.id_token}`,
    },
    body: JSON.stringify({ filename }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create upload URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate AI summary for a document
 */
export async function summarizeDocument(
  documentId: string,
  session: AuthContextProps,
) {
  if (!session?.isAuthenticated) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/summaries/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user?.id_token}`,
    },
    body: JSON.stringify({ id: documentId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to generate summary: ${response.statusText}`,
    );
  }

  return response.json();
}
