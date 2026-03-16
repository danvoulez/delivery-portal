# deliveries-public-portal

Boundary do portal externo de entregas: access links opacos, public session, queries/commands próprios, Realtime.

## Estrutura

```
domain/          types, invariants, errors
application/     contracts, service, policy
infrastructure/  token, session-store, repositories/, realtime/
edge/            resolve-session, get-tracking-view, get-driver-job-view,
                 list-messages, post-message, post-location, post-status, post-proof
```

## Docs

- Spec (split): [docs/deliveries-public-portal/](../../docs/deliveries-public-portal/README.md)
- A.1 projection: [a1-projection-queries.md](../../docs/deliveries-public-portal/a1-projection-queries.md)
- A.2 writes: [a2-write-rpcs.md](../../docs/deliveries-public-portal/a2-write-rpcs.md)
- A.3 realtime: [realtime/](../../docs/deliveries-public-portal/realtime/README.md)
- B.1 route handlers: [b1-route-handlers-wiring.md](../../docs/deliveries-public-portal/b1-route-handlers-wiring.md)
- B.2 facade refactor: [b2-facade-refactor.md](../../docs/deliveries-public-portal/b2-facade-refactor.md)
- ADR: [docs/adr/0001-external-delivery-portal-access-links.md](../../docs/adr/0001-external-delivery-portal-access-links.md)
- SQL migrations: [supabase/migrations/](../../supabase/migrations/README.md)

## Próximos passos (do Suggested file layout)

1. **tenantId em createDeliveryAccessLink** — substituir placeholder por lookup do aggregate/actor context.
2. **Session issuing** — decidir: cookie httpOnly vs bearer assinado vs tabela/kv.
3. **Read models** — getTrackingView e getDriverJobView como projections explícitas (não SELECT *).
4. **Throttling de location** — policy server-side (ex.: ignorar ping &lt; N segundos).
