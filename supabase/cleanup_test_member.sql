-- ============================================
-- CLEANUP: Remover membro criado errado
-- Substitua 'email_do_membro@exemplo.com' pelo email real
-- ============================================

-- 1. Encontrar o usuario
-- SELECT id, email FROM auth.users WHERE email = 'email_do_membro@exemplo.com';

-- 2. Remover a agencia errada que foi criada para ele
-- (cascade vai deletar agency_members tambem)
DELETE FROM public.agencies
WHERE owner_id = (
  SELECT id FROM auth.users WHERE email = 'email_do_membro@exemplo.com'
);

-- 3. Remover o usuario do auth
-- (precisa ser feito pelo Dashboard: Authentication > Users > Delete)
-- Ou via SQL com service_role:
-- DELETE FROM auth.users WHERE email = 'email_do_membro@exemplo.com';

-- Depois de limpar, crie um novo convite na interface e teste novamente
