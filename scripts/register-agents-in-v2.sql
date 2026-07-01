-- WasiAgentShop · Register 3 agents in v2 marketplace (Supabase agents table)
-- RUN THIS FRIDAY 18:00 once you're ready to activate real-mode on Kite Ozone.
-- After running: flip NEXT_PUBLIC_DEMO_MODE=false in Vercel and redeploy.
--
-- Project: caldzjhjgctpgodldqav (wasiai-v2 Supabase)
-- Use the SUPABASE_SERVICE_ROLE_KEY from Railway env (wasiai-a2a or wasiai-v2 service)
--
-- VERIFICATION: after insert, check https://app.wasiai.io/marketplace — the 3 agents
-- should appear with chain=kite-ozone-testnet (or whatever the v2 chain normalizer maps to).

BEGIN;

-- Agent 1: kyc-validator
INSERT INTO agents (slug, name, description, category, tags, price_per_call, status, creator_wallet, input_schema, output_schema, payment, capabilities)
VALUES (
  'agentshop-kyc-validator',
  'AgentShop KYC Validator',
  'Step 1 of a remittance pipeline: verifies the sender''s identity and runs AML/compliance screening for a cross-border money transfer. Returns sender tier (verified/basic/pending), AML outcome (clean/flagged/blocked), and a signed policy_id. Compliance gate that must run before any money moves.',
  'compliance',
  ARRAY['kyc', 'aml', 'remittance', 'compliance', 'identity'],
  0.001,
  'active',
  '0x94DCDb84207724A609B17e4838936832EA59B9eD',
  '{"type":"object","properties":{"senderName":{"type":"string"},"senderCountry":{"type":"string"},"legalId":{"type":"string"},"amountUSD":{"type":"number"},"receiverCountry":{"type":"string"},"purpose":{"type":"string"}},"required":["senderName","senderCountry","amountUSD","receiverCountry","purpose"]}'::jsonb,
  '{"type":"object","properties":{"isCompliant":{"type":"boolean"},"amlCheck":{"enum":["clean","flagged","blocked"]},"senderTier":{"enum":["verified","basic","pending"]},"policyId":{"type":"string"}},"required":["isCompliant","amlCheck","senderTier","policyId"]}'::jsonb,
  '{"method":"x402","asset":"PYUSD","chain":"kite-ozone-testnet","contract":"0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9"}'::jsonb,
  '[{"name":"remit.kyc-check"}]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_per_call = EXCLUDED.price_per_call,
  payment = EXCLUDED.payment,
  status = EXCLUDED.status;

-- Agent 2: corridor-discoverer
INSERT INTO agents (slug, name, description, category, tags, price_per_call, status, creator_wallet, input_schema, output_schema, payment, capabilities)
VALUES (
  'agentshop-corridor-discoverer',
  'AgentShop Corridor Discoverer',
  'Step 2 of a remittance pipeline: ranks money-transfer corridors (Bitso, Felix Pay, Wise, Western Union, etc.) by rate, speed and reliability and returns the recommended route with live FX, shortlist and rationale. It only PRICES the best route — it does NOT deliver the funds. Always pair it with a cash-out matcher so the money actually reaches the recipient.',
  'fintech',
  ARRAY['remittance', 'corridor', 'fx', 'fintech', 'latam'],
  0.05,
  'active',
  '0x94DCDb84207724A609B17e4838936832EA59B9eD',
  '{"type":"object","properties":{"amountUSD":{"type":"number"},"senderCountry":{"type":"string"},"receiverCountry":{"type":"string"},"prioritizeSpeed":{"type":"boolean"}},"required":["amountUSD","senderCountry","receiverCountry"]}'::jsonb,
  '{"type":"object","properties":{"shortlist":{"type":"array"},"recommended":{"type":"object"},"rationale":{"type":"string"},"agentPromptId":{"type":"string"}},"required":["recommended","rationale"]}'::jsonb,
  '{"method":"x402","asset":"PYUSD","chain":"kite-ozone-testnet","contract":"0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9"}'::jsonb,
  '[{"name":"remit.corridor-find"}]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_per_call = EXCLUDED.price_per_call,
  payment = EXCLUDED.payment,
  status = EXCLUDED.status;

-- Agent 3: cashout-matcher
INSERT INTO agents (slug, name, description, category, tags, price_per_call, status, creator_wallet, input_schema, output_schema, payment, capabilities)
VALUES (
  'agentshop-cashout-matcher',
  'AgentShop Cash-Out Matcher',
  'Final step of a remittance pipeline: determines WHERE and HOW the recipient physically receives the money (Yape in Peru, Bancolombia in Colombia, OXXO/BBVA in Mexico, Mercado Pago in Argentina) and computes the net amount delivered in the recipient''s local currency. REQUIRED to complete any transfer — without it the money is only priced, never delivered.',
  'fintech',
  ARRAY['remittance', 'cashout', 'fintech', 'latam', 'partner'],
  0.01,
  'active',
  '0x94DCDb84207724A609B17e4838936832EA59B9eD',
  '{"type":"object","properties":{"receiverCountry":{"type":"string"},"receiverCity":{"type":"string"},"preference":{"enum":["oxxo","bank","wallet"]},"corridorId":{"type":"string"},"netUsdToDeliver":{"type":"number"}},"required":["receiverCountry","preference"]}'::jsonb,
  '{"type":"object","properties":{"partnerId":{"type":"string"},"partnerName":{"type":"string"},"partnerType":{"enum":["oxxo","bank","wallet"]},"recipientFee":{"type":"number"},"estimatedPayoutMinutes":{"type":"number"},"netDeliveredMXN":{"type":"number"},"exchangeRate":{"type":"number"}},"required":["partnerId","partnerName","partnerType"]}'::jsonb,
  '{"method":"x402","asset":"PYUSD","chain":"kite-ozone-testnet","contract":"0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9"}'::jsonb,
  '[{"name":"remit.cashout-match"}]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price_per_call = EXCLUDED.price_per_call,
  payment = EXCLUDED.payment,
  status = EXCLUDED.status;

COMMIT;

-- Verification query
SELECT slug, name, price_per_call, status, payment->'chain' as chain, payment->'asset' as asset
FROM agents
WHERE slug LIKE 'agentshop-%'
ORDER BY slug;
