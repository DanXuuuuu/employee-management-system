import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function useInvite() {
  const [params] = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);
  const emailFromLink = useMemo(() => params.get("email") || "", [params]);

  const [state, setState] = useState({
    loading: true,
    valid: false,
    token: "",
    email: emailFromLink,
    name: "",
    error: "",
  });

  useEffect(() => {

    if (!token) {
      setState((s) => ({
        ...s,
        loading: false,
        valid: false,
        token: "",
        error: "Missing invite token.",
      }));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setState((s) => ({
          ...s,
          loading: true,
          error: "",
          token,
          email: s.email || emailFromLink,
        }));

        const res = await fetch(
          `/api/registration/verify?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        //  { valid:true/false }
        if (!res.ok) {
          setState((s) => ({
            ...s,
            loading: false,
            valid: false,
            error: data?.message || "Failed to verify invite link.",
          }));
          return;
        }

        if (!data?.valid) {
          setState((s) => ({
            ...s,
            loading: false,
            valid: false,
            error:
              data?.reason === "already_used"
                ? "This invite link has already been used."
                : "Invalid or expired invite link.",
          }));
          return;
        }

        // valid：set email from link
        setState((s) => ({
          ...s,
          loading: false,
          valid: true,
          token,
          email: data?.email || s.email || emailFromLink,
          name: data?.name || "",
          error: "",
        }));
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          valid: false,
          error: e?.message || "Network error.",
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, emailFromLink]);

  return state; // { loading, valid, token, email, name, error }
}
