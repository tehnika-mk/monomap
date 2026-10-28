# MonoMap — self-hosted static build served by nginx.
#
# MonoMap is a SvelteKit static export, so there is no runtime process to
# configure: PUBLIC_SUPABASE_* and PUBLIC_GA_ID are baked in at build time.
# The defaults below are placeholders, which leaves accounts/sync disabled
# (local-only mode, the app's normal offline behaviour) and analytics off.

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG PUBLIC_SUPABASE_URL=https://example.supabase.co
ARG PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_SUPABASE_ANON_KEY
ARG PUBLIC_GA_ID=

ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
	PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY \
	PUBLIC_GA_ID=$PUBLIC_GA_ID

RUN npm run build

FROM nginx:alpine

COPY deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
