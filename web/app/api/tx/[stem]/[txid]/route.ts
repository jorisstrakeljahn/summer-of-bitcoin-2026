import { NextResponse } from "next/server";
import { getTxDetail } from "@/lib/block-cache";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ stem: string; txid: string }> },
) {
  return params.then(({ stem, txid }) => {
    try {
      const detail = getTxDetail(stem, txid);
      if (!detail) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(detail);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  });
}
