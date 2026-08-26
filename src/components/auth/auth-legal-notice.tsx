const privacyPolicyUrl =
  "https://www.directscal.com/politica-de-privacidade";
const usagePolicyUrl = "https://www.directscal.com/politica-de-uso";

const linkClasses =
  "rounded-sm text-foreground/80 underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-muted-foreground dark:hover:text-foreground";

export function AuthLegalNotice() {
  return (
    <p className="text-xs leading-[18px] text-muted-foreground">
      Ao continuar, você concorda com a{" "}
      <a
        href={privacyPolicyUrl}
        target="_blank"
        rel="noreferrer"
        className={linkClasses}
      >
        Política de Privacidade
      </a>{" "}
      e a{" "}
      <a
        href={usagePolicyUrl}
        target="_blank"
        rel="noreferrer"
        className={linkClasses}
      >
        Política de Uso
      </a>{" "}
      da Directscal.
    </p>
  );
}
