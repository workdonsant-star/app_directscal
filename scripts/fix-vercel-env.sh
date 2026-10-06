#!/bin/zsh
# Recria em Production e Preview as variáveis que chegam vazias no runtime da Vercel.
# Valores sensíveis vêm do .env.local; URLs e flags de login são fixadas para produção.
set -u
cd "$(dirname "$0")/.."

V() { npx -y vercel@latest "$@" --non-interactive; }
loc() { grep "^$1=" .env.local | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

set_var() {
  local k=$1 val=$2
  if [ -z "$val" ]; then echo "PULADO $k (vazio)"; return; fi
  for env in production preview; do
    V env rm "$k" $env --yes >/dev/null 2>&1
    printf '%s' "$val" | V env add "$k" $env --sensitive >/dev/null 2>&1 || echo "FALHOU $k $env"
  done
  echo "ok $k"
}

for k in AUTH_SECRET AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET AUTH_ALLOWED_DOMAINS AUTH_ALLOWED_EMAILS \
         AUTH_ORG_BY_DOMAIN AUTH_SUPERADMIN_EMAILS SLACK_BOT_TOKEN SLACK_ORGANIZATION_ID; do
  set_var $k "$(loc $k)"
done

set_var AUTH_URL https://app.directscal.com
set_var PUBLIC_APP_URL https://app.directscal.com
set_var SLACK_TEAM_ID T0C4WBS6ZFA
set_var AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN false
set_var AUTH_ENABLE_DEV_PASSWORD_LOGIN false

# Senha de superadmin desligada em produção; lista de admins vazia.
for k in AUTH_SUPERADMIN_PASSWORD AUTH_ADMIN_EMAILS; do
  for env in production preview; do V env rm $k $env --yes >/dev/null 2>&1; done
  echo "removido $k"
done

echo "\nRedeploy da produção..."
V redeploy "$(V ls app-directscal 2>/dev/null | grep -o 'https://app-directscal-[a-z0-9]*-don-santos-projects.vercel.app' | head -1)" --target production
