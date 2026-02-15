"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Star, MapPin, Briefcase, Loader2, Wand2, UserCheck,
} from "lucide-react";
import {
  DISCIPLINE_LABELS,
  type CaseDiscipline,
} from "@/lib/types";

interface ScoreBreakdown {
  rating: number;
  availability: number;
  experience: number;
  location: number;
  completedCases: number;
}

interface ScoredExpert {
  _id: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  user?: { _id: string; displayName: string; email: string };
  disciplines: string[];
  specialization?: string;
  experienceYears: number;
  city?: string;
  rating: number;
  totalCases: number;
  completedCases: number;
  baseFee?: number;
}

interface ExpertSuggestionsProps {
  caseId: string;
  onAssign?: (expertUserId: string) => void;
}

export default function ExpertSuggestions({ caseId, onAssign }: ExpertSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ScoredExpert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadSuggestions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${caseId}/suggest-expert`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
        setLoaded(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(expert: ScoredExpert) {
    if (!expert.user?._id || !onAssign) return;
    setAssigning(expert._id);
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedExpert: expert.user._id }),
      });
      const data = await res.json();
      if (data.success) {
        onAssign(expert.user._id);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setAssigning(null);
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center py-8">
        <Wand2 className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          Usar el motor inteligente para sugerir peritos
        </p>
        <Button onClick={loadSuggestions} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Sugerir Peritos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Top {suggestions.length} candidatos sugeridos</p>
        <Button variant="outline" size="sm" onClick={loadSuggestions} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Recalcular
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay peritos disponibles para esta disciplina
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((expert, index) => (
            <Card key={expert._id} className={index === 0 ? "border-primary/50 bg-primary/5" : ""}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Recomendado
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    <p className="font-semibold mt-1">{expert.user?.displayName || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{expert.specialization || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{expert.score}</p>
                    <p className="text-xs text-muted-foreground">/ 100 pts</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">Rating (40%)</span>
                    <Progress value={expert.scoreBreakdown.rating * 100 / 40} className="h-1.5 flex-1" />
                    <span className="w-8 text-right">{expert.scoreBreakdown.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">Disponib. (20%)</span>
                    <Progress value={expert.scoreBreakdown.availability * 100 / 20} className="h-1.5 flex-1" />
                    <span className="w-8 text-right">{expert.scoreBreakdown.availability}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">Experiencia (20%)</span>
                    <Progress value={expert.scoreBreakdown.experience * 100 / 20} className="h-1.5 flex-1" />
                    <span className="w-8 text-right">{expert.scoreBreakdown.experience}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">Ubicacion (10%)</span>
                    <Progress value={expert.scoreBreakdown.location * 100 / 10} className="h-1.5 flex-1" />
                    <span className="w-8 text-right">{expert.scoreBreakdown.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-muted-foreground">Casos (10%)</span>
                    <Progress value={expert.scoreBreakdown.completedCases * 100 / 10} className="h-1.5 flex-1" />
                    <span className="w-8 text-right">{expert.scoreBreakdown.completedCases}</span>
                  </div>
                </div>

                {/* Expert Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    {(expert.rating || 0).toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {expert.experienceYears} anos
                  </span>
                  {expert.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {expert.city}
                    </span>
                  )}
                  <span>{expert.completedCases}/{expert.totalCases} casos</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {expert.disciplines?.map((d) => (
                    <Badge key={d} variant="outline" className="text-xs">
                      {DISCIPLINE_LABELS[d as CaseDiscipline] || d}
                    </Badge>
                  ))}
                </div>

                {onAssign && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleAssign(expert)}
                      disabled={!!assigning}
                    >
                      {assigning === expert._id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="mr-2 h-3.5 w-3.5" />
                      )}
                      Asignar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
