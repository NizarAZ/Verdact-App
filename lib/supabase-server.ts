import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/server-env";

export type DocumentRecord = {
  id: string;
  wallet_address: string;
  file_name: string;
  title?: string | null;
  onchain_tx_hash: string;
  blob_id: string;
  file_hash: string;
  chunk_count?: number | null;
  size?: number | null;
  created_at?: string | null;
};

export type ReceiptBlobReference = {
  path: string;
  tx_hash?: string | null;
  file_name?: string | null;
};

export type AnswerReceiptRecord = {
  id?: string;
  wallet_address: string;
  query: string;
  answer: string;
  receipt_hash: string;
  onchain_tx_hash: string;
  blob_ids_used: string[];
  blobs_used?: ReceiptBlobReference[] | null;
  receipt_blob_id?: string | null;
  created_at?: string | null;
};

export function getSupabaseAdmin() {
  const url = readServerEnv("SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function insertDocumentRecord(record: DocumentRecord) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("documents").upsert(record, { onConflict: "id" });

  if (error && (error.code === "PGRST204" || error.message.includes("chunk_count") || error.message.includes("size"))) {
    const fallbackRecord = {
      id: record.id,
      wallet_address: record.wallet_address,
      file_name: record.file_name,
      title: record.title,
      onchain_tx_hash: record.onchain_tx_hash,
      blob_id: record.blob_id,
      file_hash: record.file_hash,
      created_at: record.created_at
    };
    const fallback = await supabase.from("documents").upsert(fallbackRecord, { onConflict: "id" });

    if (fallback.error) throw fallback.error;
    return;
  }

  if (error) throw error;
}

export async function listDocumentRecords(walletAddress: string, limit: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
}

export async function getDocumentRecord(walletAddress: string, documentId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("wallet_address", walletAddress)
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw error;
  return data as DocumentRecord | null;
}

export async function getDocumentRecordByBlobId(walletAddress: string, blobId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("documents")
    .select("onchain_tx_hash,file_name,blob_id,wallet_address,id,file_hash,title,chunk_count,size,created_at")
    .eq("wallet_address", walletAddress)
    .eq("blob_id", blobId)
    .maybeSingle();

  if (error) throw error;
  return data as DocumentRecord | null;
}

export async function insertAnswerReceiptRecord(record: AnswerReceiptRecord) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("answer_receipts").insert(record).select("*").single();

  if (error && (error.code === "PGRST204" || error.message.includes("blobs_used") || error.message.includes("receipt_blob_id"))) {
    const fallbackRecord = {
      id: record.id,
      wallet_address: record.wallet_address,
      query: record.query,
      answer: record.answer,
      receipt_hash: record.receipt_hash,
      onchain_tx_hash: record.onchain_tx_hash,
      blob_ids_used: record.blob_ids_used
    };
    const fallback = await supabase.from("answer_receipts").insert(fallbackRecord).select("*").single();

    if (fallback.error) throw fallback.error;
    return fallback.data as AnswerReceiptRecord & { id: string };
  }

  if (error) throw error;
  return data as AnswerReceiptRecord & { id: string };
}

export async function listAnswerReceiptRecords(walletAddress: string, limit: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("answer_receipts")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AnswerReceiptRecord[];
}

export async function getDocumentByTxHash(txHash: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("documents").select("*").eq("onchain_tx_hash", txHash).maybeSingle();

  if (error) throw error;
  return data as DocumentRecord | null;
}

export async function getReceiptByTxHash(txHash: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("answer_receipts").select("*").eq("onchain_tx_hash", txHash).maybeSingle();

  if (error) throw error;
  return data as AnswerReceiptRecord | null;
}

export async function getAnswerReceiptById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("answer_receipts").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data as (AnswerReceiptRecord & { id: string }) | null;
}
