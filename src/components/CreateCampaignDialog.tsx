import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Errors = Partial<Record<"name" | "start_date" | "end_date", string>>;

export type CampaignRecord = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

export function CreateCampaignDialog({
  onCreated,
  campaign,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  onCreated: () => void;
  campaign?: CampaignRecord;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  };
  const isEdit = !!campaign;
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(campaign?.name ?? "");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const reset = () => {
    setName(campaign?.name ?? "");
    setStartDate(campaign?.start_date ?? "");
    setEndDate(campaign?.end_date ?? "");
    setErrors({});
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Campaign name is required";
    if (!startDate) next.start_date = "Start date is required";
    if (!endDate) next.end_date = "End date is required";
    else if (startDate && endDate <= startDate) next.end_date = "End date must be after start date";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .insert({ name: name.trim(), start_date: startDate, end_date: endDate });
      if (error) throw error;
      toast.success("Campaign created");
      reset();
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Couldn't create the campaign. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
          <DialogDescription>Set up a new influencer marketing campaign.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring launch"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-start">Start date</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-end">End date</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
