import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Matched",
  "Won",
  "Lost",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type PipelineLead = {
  id: string;
  campaign_influencer_id: string;
  full_name: string;
  company_name: string;
  roles_hiring_for: string;
  stage: string | null;
  hire_start_date: string | null;
};

type Props = {
  leads: PipelineLead[];
  handles: Record<string, string>;
  loading?: boolean;
  onChanged?: () => void;
};

function payoutBadge(hireStart: string | null | undefined) {
  if (!hireStart) return null;
  const due = new Date(hireStart);
  due.setDate(due.getDate() + 30);
  const today = new Date();
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  return days > 0 ? `Payout in ${days} day${days === 1 ? "" : "s"}` : "Payout due";
}

export function PipelineBoard({ leads, handles, loading, onChanged }: Props) {
  const [local, setLocal] = useState<PipelineLead[]>(leads);
  const [pending, setPending] = useState<{ leadId: string; from: PipelineStage } | null>(null);
  const [hireDate, setHireDate] = useState("");

  useEffect(() => {
    setLocal(leads);
  }, [leads]);

  const grouped = useMemo(() => {
    const map: Record<PipelineStage, PipelineLead[]> = {
      New: [],
      Contacted: [],
      Qualified: [],
      Matched: [],
      Won: [],
      Lost: [],
    };
    for (const lead of local) {
      const stage = (lead.stage ?? "New") as PipelineStage;
      (map[stage] ?? map.New).push(lead);
    }
    return map;
  }, [local]);

  const applyStage = (leadId: string, stage: PipelineStage, hire?: string | null) =>
    setLocal((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, stage, hire_start_date: hire === undefined ? l.hire_start_date : hire }
          : l,
      ),
    );

  const persist = async (
    leadId: string,
    stage: PipelineStage,
    from: PipelineStage,
    hire?: string,
  ) => {
    const payload: { stage: string; hire_start_date?: string } = hire
      ? { stage, hire_start_date: hire }
      : { stage };
    const { error } = await supabase.from("leads").update(payload).eq("id", leadId);
    if (error) {
      applyStage(leadId, from);
      toast.error("Couldn't move that lead. Please try again.");
      return;
    }
    toast.success(`Moved to ${stage}`);
    onChanged?.();
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const to = destination.droppableId as PipelineStage;
    const from = source.droppableId as PipelineStage;
    if (to === from) return;

    if (to === "Won") {
      const lead = local.find((l) => l.id === draggableId);
      setHireDate(lead?.hire_start_date ?? "");
      applyStage(draggableId, "Won");
      setPending({ leadId: draggableId, from });
      return;
    }
    applyStage(draggableId, to);
    void persist(draggableId, to, from);
  };

  const confirmWon = () => {
    if (!pending || !hireDate) return;
    const { leadId, from } = pending;
    applyStage(leadId, "Won", hireDate);
    setPending(null);
    void persist(leadId, "Won", from, hireDate);
  };

  const cancelWon = () => {
    if (pending) applyStage(pending.leadId, pending.from);
    setPending(null);
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>;
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`w-[260px] shrink-0 rounded-xl border p-3 transition-colors ${
                    snapshot.isDraggingOver
                      ? "border-slate-400 bg-slate-100"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {stage}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                      {grouped[stage].length}
                    </span>
                  </div>

                  <div className="flex min-h-[80px] flex-col gap-2">
                    {grouped[stage].map((lead, index) => {
                      const badge = stage === "Won" ? payoutBadge(lead.hire_start_date) : null;
                      return (
                        <Draggable draggableId={lead.id} index={index} key={lead.id}>
                          {(drag, dragSnapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              className={`rounded-lg border bg-white p-3 text-sm shadow-sm ${
                                dragSnapshot.isDragging ? "border-slate-400" : "border-slate-200"
                              }`}
                            >
                              <p className="font-medium text-slate-900">{lead.full_name}</p>
                              <p className="text-xs text-slate-600">{lead.company_name}</p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {lead.roles_hiring_for}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                {handles[lead.campaign_influencer_id] ?? "—"}
                              </p>
                              {badge ? (
                                <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  {badge}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={pending !== null} onOpenChange={(open) => (!open ? cancelWon() : null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>When does this hire start?</DialogTitle>
          </DialogHeader>
          <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={cancelWon}>
              Cancel
            </Button>
            <Button onClick={confirmWon} disabled={!hireDate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
