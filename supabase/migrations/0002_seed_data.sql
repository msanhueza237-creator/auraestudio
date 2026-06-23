-- ============================================================
-- AURA ESTUDIO - DATOS DE EJEMPLO
-- ============================================================
-- INSTRUCCIONES:
-- 1. Primero ejecuta el archivo 0001_initial_schema.sql (si no lo has hecho)
-- 2. Regístrate en la app (crea tu cuenta de usuario)
-- 3. Luego ejecuta ESTE script para insertar datos de ejemplo
-- ============================================================

do $$
declare
  v_user_id uuid;
  -- Clientes
  v_client_maria uuid;
  v_client_ana uuid;
  v_client_sofia uuid;
  v_client_carmen uuid;
  v_client_lucia uuid;
  v_client_isabel uuid;
  v_client_elena uuid;
  v_client_patricia uuid;
  v_client_laura uuid;
  v_client_beatriz uuid;
  -- Servicios
  v_svc_corte_s uuid;
  v_svc_corte_c uuid;
  v_svc_color uuid;
  v_svc_mechas uuid;
  v_svc_queratina uuid;
  v_svc_peinado uuid;
  v_svc_alisado uuid;
  v_svc_lavado uuid;
  v_svc_tratamiento uuid;
  v_svc_barba uuid;
  -- Productos
  v_prod_champu uuid;
  v_prod_acondicionador uuid;
  v_prod_tinte uuid;
  v_prod_oxidante uuid;
  v_prod_mascarilla uuid;
  v_prod_serum uuid;
  v_prod_spray uuid;
  v_prod_ampolla uuid;
  v_prod_decolorante uuid;
  v_prod_aceite uuid;
  -- Citas
  v_cita_1 uuid;
  v_cita_2 uuid;
  v_cita_3 uuid;
  v_cita_4 uuid;
  v_cita_5 uuid;
  v_cita_6 uuid;
  v_cita_7 uuid;
  v_cita_8 uuid;
  -- Servicios prestados
  v_aptsvc_1 uuid;
  v_aptsvc_2 uuid;
  v_aptsvc_3 uuid;
  v_aptsvc_4 uuid;
  v_aptsvc_5 uuid;
  v_aptsvc_6 uuid;
  v_aptsvc_7 uuid;
  v_aptsvc_8 uuid;
  v_aptsvc_9 uuid;
  v_aptsvc_10 uuid;
begin
  -- ============================================================
  -- Obtener el user_id del primer usuario registrado
  -- ============================================================
  select id into v_user_id from auth.users order by created_at asc limit 1;

  if v_user_id is null then
    raise exception '❌ No hay usuarios registrados. Primero regístrate en la app y luego ejecuta este script.';
  end if;

  raise notice '✅ Usuario encontrado: %', v_user_id;

  -- ============================================================
  -- ACTUALIZAR PERFIL DEL USUARIO
  -- ============================================================
  update public.profiles
  set
    full_name = 'Ana María Ruiz',
    business_name = 'Aura Estudio',
    phone = '+34 612 345 678',
    hourly_cost = 18.00,
    currency = 'EUR',
    locale = 'es-ES'
  where id = v_user_id;

  -- ============================================================
  -- CLIENTES (10 clientes realistas)
  -- ============================================================

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'María García López', '+34 611 223 344', 'maria.garcia@email.com', '1988-03-15',
     'Clienta habitual desde 2022. Prefiere horarios de mañana.',
     'Le gusta el café con leche mientras espera. Tinte rubio ceniza.',
     'Alergia a tinte con amoniaco – usar solo tintes orgánicos')
  returning id into v_client_maria;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Ana Rodríguez Martínez', '+34 622 334 455', 'ana.rodriguez@email.com', '1992-07-22',
     'Pelo fino y delicado. Necesita tratamientos hidratantes frecuentes.',
     'Corte con capas largas. No le gusta el flequillo.',
     null)
  returning id into v_client_ana;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Sofía Fernández Torres', '+34 633 445 566', 'sofia.fernandez@email.com', '1985-11-30',
     'Viene cada 6 semanas para retocar raíces. Siempre puntual.',
     'Base castaño oscuro con mechas caramelo. Secado con difusor.',
     null)
  returning id into v_client_sofia;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Carmen Moreno Ruiz', '+34 644 556 677', null, '1978-01-08',
     'Pelo rizado natural. Lleva años con nosotras.',
     'Método curly girl. Solo productos sin sulfatos ni siliconas.',
     'Cuero cabelludo sensible – no aplicar calor directo')
  returning id into v_client_carmen;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Lucía Sánchez Jiménez', '+34 655 667 788', 'lucia.sanchez@email.com', '1995-05-19',
     'Clienta joven, le gustan los cambios de color frecuentes.',
     'Colores fantasía (rosa, lavanda). Siempre quiere ver fotos de inspiración.',
     null)
  returning id into v_client_lucia;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Isabel Díaz Navarro', '+34 666 778 899', 'isabel.diaz@email.com', '1970-09-03',
     'Señora muy elegante. Viene los viernes para peinado semanal.',
     'Peinado clásico con volumen. Laca de fijación fuerte.',
     'Problemas cervicales – acomodar bien en el lavacabezas')
  returning id into v_client_isabel;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Elena Pérez Romero', '+34 677 889 900', null, '1990-12-25',
     'Trabaja en marketing, siempre tiene prisa. Prefiere citas rápidas.',
     'Corte bob liso. Le gusta el acabado brillante con sérum.',
     null)
  returning id into v_client_elena;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Patricia Herrera Molina', '+34 688 990 011', 'patricia.herrera@email.com', '1983-06-14',
     'Viene con su hija adolescente (Valeria). Suelen pedir cita doble.',
     'Mechas balayage rubio dorado. Largo por debajo de los hombros.',
     null)
  returning id into v_client_patricia;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Laura Martín Gil', '+34 699 001 122', 'laura.martin@email.com', '1998-02-28',
     'Novia – boda prevista para septiembre 2026. Está en fase de pruebas.',
     'Quiere pelo largo y sano para el día de la boda. Tratamientos de keratina.',
     null)
  returning id into v_client_laura;

  insert into public.clients (id, user_id, full_name, phone, email, birth_date, notes, preferences, alerts)
  values
    (gen_random_uuid(), v_user_id, 'Beatriz López Castro', '+34 600 112 233', 'beatriz.lopez@email.com', '1975-08-11',
     'Peluquera retirada. Conoce muy bien los productos y técnicas.',
     'Rubio platino. Exigente con la calidad del decolorante.',
     'Piel atópica – test de parche obligatorio antes de coloración')
  returning id into v_client_beatriz;

  raise notice '✅ 10 clientes insertados';

  -- ============================================================
  -- CATÁLOGO DE SERVICIOS (10 servicios)
  -- ============================================================

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Corte de Pelo Señora', 'Cortes',
     'Corte personalizado con lavado, acondicionador y secado con modelado. Incluye asesoría de estilo.',
     35.00, 45, 13.50, true)
  returning id into v_svc_corte_s;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Corte de Pelo Caballero', 'Cortes',
     'Corte clásico o moderno con lavado y peinado. Opción de perfilado con máquina.',
     22.00, 30, 9.00, true)
  returning id into v_svc_corte_c;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Coloración Completa', 'Coloración',
     'Tinte global de raíz a puntas con productos premium. Incluye lavado y secado posterior.',
     65.00, 90, 27.00, true)
  returning id into v_svc_color;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Mechas / Balayage', 'Coloración',
     'Técnica de iluminación con mechas, babylights o balayage. Resultado natural y luminoso.',
     85.00, 120, 36.00, true)
  returning id into v_svc_mechas;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Tratamiento de Queratina', 'Tratamientos',
     'Alisado y nutrición profunda con queratina brasileña. Duración del efecto: 3-4 meses.',
     120.00, 150, 45.00, true)
  returning id into v_svc_queratina;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Peinado Especial / Recogido', 'Peinados',
     'Peinado para eventos, bodas, comuniones. Incluye prueba previa si se solicita.',
     55.00, 60, 18.00, true)
  returning id into v_svc_peinado;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Alisado Japonés', 'Tratamientos',
     'Alisado permanente con técnica japonesa. Pelo liso durante 6-8 meses.',
     180.00, 180, 54.00, true)
  returning id into v_svc_alisado;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Lavado y Secado', 'Básicos',
     'Lavado con champú profesional, acondicionador y secado con cepillo redondo o difusor.',
     18.00, 25, 7.50, true)
  returning id into v_svc_lavado;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Tratamiento Hidratante Profundo', 'Tratamientos',
     'Mascarilla profesional con calor y masaje capilar. Ideal para pelo seco o dañado.',
     40.00, 40, 12.00, true)
  returning id into v_svc_tratamiento;

  insert into public.services (id, user_id, name, category, description, base_price, estimated_minutes, estimated_labor_cost, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Arreglo de Barba', 'Cortes',
     'Perfilado y arreglo de barba con navaja y toalla caliente.',
     15.00, 20, 6.00, true)
  returning id into v_svc_barba;

  raise notice '✅ 10 servicios insertados';

  -- ============================================================
  -- PRODUCTOS DE INVENTARIO (10 productos)
  -- ============================================================

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Champú Reparador Résistance', 'Kérastase', 'Champús', 'KER-CHP-001', 'ml',
     0.0520, 2500, 500, 'Distribuciones Capilares S.L.', true)
  returning id into v_prod_champu;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Acondicionador Nutritive Lait Vital', 'Kérastase', 'Acondicionadores', 'KER-ACD-002', 'ml',
     0.0680, 1800, 400, 'Distribuciones Capilares S.L.', true)
  returning id into v_prod_acondicionador;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Tinte Permanente Inoa Sin Amoniaco', 'L''Oréal Professionnel', 'Tintes', 'LOR-TNT-003', 'ml',
     0.1200, 3000, 600, 'L''Oréal España Distribución', true)
  returning id into v_prod_tinte;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Oxidante Crema 20 Volúmenes', 'L''Oréal Professionnel', 'Oxidantes', 'LOR-OXI-004', 'ml',
     0.0250, 5000, 1000, 'L''Oréal España Distribución', true)
  returning id into v_prod_oxidante;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Mascarilla Elixir Ultime', 'Kérastase', 'Mascarillas', 'KER-MSK-005', 'ml',
     0.0950, 1200, 300, 'Distribuciones Capilares S.L.', true)
  returning id into v_prod_mascarilla;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Sérum Protector Térmico Mythic Oil', 'L''Oréal Professionnel', 'Acabado', 'LOR-SRM-006', 'ml',
     0.1500, 800, 200, 'L''Oréal España Distribución', true)
  returning id into v_prod_serum;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Spray Fijador Extra Fuerte Elnett', 'L''Oréal Paris', 'Fijación', 'LOR-SPR-007', 'ml',
     0.0300, 2000, 400, 'L''Oréal España Distribución', true)
  returning id into v_prod_spray;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Ampolla Botox Capilar Intensivo', 'Tahe', 'Tratamientos', 'TAH-AMP-008', 'unidades',
     3.5000, 24, 6, 'Tahe Distribuidora Oficial', true)
  returning id into v_prod_ampolla;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Decolorante en Polvo Blondys', 'L''Oréal Professionnel', 'Decoloración', 'LOR-DEC-009', 'gr',
     0.0400, 1500, 300, 'L''Oréal España Distribución', true)
  returning id into v_prod_decolorante;

  insert into public.products (id, user_id, name, brand, category, sku, unit, unit_cost, current_stock, minimum_stock, supplier, is_active)
  values
    (gen_random_uuid(), v_user_id, 'Aceite de Argán Puro Moroccanoil', 'Moroccanoil', 'Aceites', 'MOR-ACE-010', 'ml',
     0.2800, 500, 100, 'Moroccanoil España', true)
  returning id into v_prod_aceite;

  raise notice '✅ 10 productos insertados';

  -- ============================================================
  -- MOVIMIENTOS DE STOCK INICIALES (compras)
  -- ============================================================

  insert into public.stock_movements (user_id, product_id, movement_type, quantity, unit_cost, reference, notes) values
    (v_user_id, v_prod_champu,         'purchase', 2500, 0.0520, 'FAC-2026-001', 'Compra inicial apertura Aura Estudio'),
    (v_user_id, v_prod_acondicionador, 'purchase', 1800, 0.0680, 'FAC-2026-001', 'Compra inicial apertura Aura Estudio'),
    (v_user_id, v_prod_tinte,          'purchase', 3000, 0.1200, 'FAC-2026-002', 'Pedido tintes L''Oréal Inoa lote completo'),
    (v_user_id, v_prod_oxidante,       'purchase', 5000, 0.0250, 'FAC-2026-002', 'Pedido oxidantes L''Oréal'),
    (v_user_id, v_prod_mascarilla,     'purchase', 1200, 0.0950, 'FAC-2026-003', 'Pedido Kérastase mascarillas'),
    (v_user_id, v_prod_serum,          'purchase', 800,  0.1500, 'FAC-2026-004', 'Sérum Mythic Oil x4 envases'),
    (v_user_id, v_prod_spray,          'purchase', 2000, 0.0300, 'FAC-2026-005', 'Lote lacas Elnett profesional'),
    (v_user_id, v_prod_ampolla,        'purchase', 24,   3.5000, 'FAC-2026-006', 'Caja 24 ampollas Tahe botox capilar'),
    (v_user_id, v_prod_decolorante,    'purchase', 1500, 0.0400, 'FAC-2026-007', 'Decolorante Blondys 3 botes de 500g'),
    (v_user_id, v_prod_aceite,         'purchase', 500,  0.2800, 'FAC-2026-008', 'Moroccanoil aceite argán x5 frascos');

  raise notice '✅ 10 movimientos de stock iniciales insertados';

  -- ============================================================
  -- CITAS (8 citas - mezcla de completadas y programadas)
  -- ============================================================

  -- Cita 1: María - Corte + Color (completada, hace 3 semanas)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_maria,
     now() - interval '21 days' + interval '10 hours',
     now() - interval '21 days' + interval '12 hours 15 minutes',
     'completed', 'Corte + Coloración completa',
     'Retoque de raíces rubio ceniza y corte de puntas. Muy contenta con el resultado.')
  returning id into v_cita_1;

  -- Cita 2: Sofía - Mechas balayage (completada, hace 2 semanas)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_sofia,
     now() - interval '14 days' + interval '9 hours',
     now() - interval '14 days' + interval '11 hours 30 minutes',
     'completed', 'Mechas balayage caramelo',
     'Mechas abiertas con técnica balayage. Tonos caramelo y dorado.')
  returning id into v_cita_2;

  -- Cita 3: Carmen - Tratamiento hidratante (completada, hace 10 días)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_carmen,
     now() - interval '10 days' + interval '11 hours',
     now() - interval '10 days' + interval '12 hours',
     'completed', 'Tratamiento hidratante rizos',
     'Método curly girl. Mascarilla intensiva con calor. Rizos definidos y sin frizz.')
  returning id into v_cita_3;

  -- Cita 4: Ana - Corte señora (completada, hace 5 días)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_ana,
     now() - interval '5 days' + interval '16 hours',
     now() - interval '5 days' + interval '17 hours',
     'completed', 'Corte con capas largas',
     'Corte refreshing. Se mantiene el largo, se refrescan las capas.')
  returning id into v_cita_4;

  -- Cita 5: Laura - Queratina (completada, hace 3 días)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_laura,
     now() - interval '3 days' + interval '9 hours 30 minutes',
     now() - interval '3 days' + interval '12 hours',
     'completed', 'Tratamiento keratina pre-boda',
     'Segundo tratamiento de queratina. Preparación para la boda de septiembre.')
  returning id into v_cita_5;

  -- Cita 6: Isabel - Peinado viernes (completada, ayer)
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_isabel,
     now() - interval '1 day' + interval '10 hours',
     now() - interval '1 day' + interval '11 hours',
     'completed', 'Lavado y peinado semanal',
     'Lavado, secado con volumen y laca de fijación fuerte como siempre.')
  returning id into v_cita_6;

  -- Cita 7: Lucía - Programada para mañana
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_lucia,
     now() + interval '1 day' + interval '10 hours',
     now() + interval '1 day' + interval '12 hours 30 minutes',
     'scheduled', 'Color fantasía lavanda + corte',
     'Quiere un tono lavanda pastel. Llevar fotos de referencia preparadas.')
  returning id into v_cita_7;

  -- Cita 8: Patricia - Programada para pasado mañana
  insert into public.appointments (id, user_id, client_id, starts_at, ends_at, status, title, notes)
  values
    (gen_random_uuid(), v_user_id, v_client_patricia,
     now() + interval '2 days' + interval '11 hours',
     now() + interval '2 days' + interval '13 hours',
     'scheduled', 'Retoque mechas + tratamiento',
     'Retoque de raíces mechas balayage + mascarilla nutritiva.')
  returning id into v_cita_8;

  raise notice '✅ 8 citas insertadas (6 completadas + 2 programadas)';

  -- ============================================================
  -- SERVICIOS PRESTADOS EN CITAS COMPLETADAS
  -- ============================================================

  -- Cita 1 (María): Corte Señora + Coloración Completa
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_1, v_svc_corte_s, 'Corte de Pelo Señora', 35.00, 40, 12.00, 3.64, 'Corte de puntas y capas suaves')
  returning id into v_aptsvc_1;

  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_1, v_svc_color, 'Coloración Completa', 65.00, 85, 25.50, 15.40, 'Rubio ceniza 9.1 raíz a puntas')
  returning id into v_aptsvc_2;

  -- Cita 2 (Sofía): Mechas Balayage
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_2, v_svc_mechas, 'Mechas / Balayage', 85.00, 130, 39.00, 18.50, 'Balayage abierto tonos caramelo y dorado')
  returning id into v_aptsvc_3;

  -- Cita 3 (Carmen): Tratamiento Hidratante + Lavado
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_3, v_svc_tratamiento, 'Tratamiento Hidratante Profundo', 40.00, 45, 13.50, 8.35, 'Mascarilla con calor 20 min + masaje capilar')
  returning id into v_aptsvc_4;

  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_3, v_svc_lavado, 'Lavado y Secado', 18.00, 20, 6.00, 2.96, 'Secado con difusor para respetar el rizo')
  returning id into v_aptsvc_5;

  -- Cita 4 (Ana): Corte Señora
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_4, v_svc_corte_s, 'Corte de Pelo Señora', 35.00, 50, 15.00, 3.64, 'Corte refreshing con capas largas')
  returning id into v_aptsvc_6;

  -- Cita 5 (Laura): Queratina
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_5, v_svc_queratina, 'Tratamiento de Queratina', 120.00, 140, 42.00, 22.10, 'Queratina brasileña completa. Pelo hasta cintura.')
  returning id into v_aptsvc_7;

  -- Cita 6 (Isabel): Lavado y Peinado
  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_6, v_svc_lavado, 'Lavado y Secado', 18.00, 25, 7.50, 2.96, 'Lavado y marcado con volumen')
  returning id into v_aptsvc_8;

  insert into public.appointment_services (id, user_id, appointment_id, service_id, service_name, price_charged, minutes_spent, labor_cost, product_cost, notes)
  values
    (gen_random_uuid(), v_user_id, v_cita_6, v_svc_peinado, 'Peinado Especial / Recogido', 35.00, 30, 9.00, 1.50, 'Peinado clásico con volumen y laca')
  returning id into v_aptsvc_9;

  raise notice '✅ 9 servicios prestados insertados';

  -- ============================================================
  -- USO DE PRODUCTOS EN SERVICIOS PRESTADOS
  -- ============================================================

  -- Cita 1 - Servicio 1 (Corte María): Champú + Acondicionador
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_1, v_prod_champu,         'Champú Reparador Résistance',      30, 'ml', 0.0520),
    (v_user_id, v_aptsvc_1, v_prod_acondicionador,  'Acondicionador Nutritive',          20, 'ml', 0.0680);

  -- Cita 1 - Servicio 2 (Color María): Tinte + Oxidante + Champú
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_2, v_prod_tinte,     'Tinte Inoa Sin Amoniaco',    80, 'ml', 0.1200),
    (v_user_id, v_aptsvc_2, v_prod_oxidante,  'Oxidante Crema 20 Vol',     120, 'ml', 0.0250),
    (v_user_id, v_aptsvc_2, v_prod_champu,    'Champú Reparador Résistance', 30, 'ml', 0.0520);

  -- Cita 2 - Servicio 3 (Mechas Sofía): Decolorante + Oxidante + Tinte + Champú + Sérum
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_3, v_prod_decolorante, 'Decolorante Blondys',         60, 'gr', 0.0400),
    (v_user_id, v_aptsvc_3, v_prod_oxidante,    'Oxidante Crema 20 Vol',      100, 'ml', 0.0250),
    (v_user_id, v_aptsvc_3, v_prod_tinte,       'Tinte Inoa Sin Amoniaco',     40, 'ml', 0.1200),
    (v_user_id, v_aptsvc_3, v_prod_champu,      'Champú Reparador Résistance', 30, 'ml', 0.0520),
    (v_user_id, v_aptsvc_3, v_prod_serum,       'Sérum Protector Térmico',     10, 'ml', 0.1500);

  -- Cita 3 - Servicio 4 (Tratamiento Carmen): Mascarilla + Aceite + Ampolla
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_4, v_prod_mascarilla, 'Mascarilla Elixir Ultime',     50, 'ml', 0.0950),
    (v_user_id, v_aptsvc_4, v_prod_aceite,     'Aceite de Argán Moroccanoil',  10, 'ml', 0.2800),
    (v_user_id, v_aptsvc_4, v_prod_ampolla,    'Ampolla Botox Capilar',         1, 'unidades', 3.5000);

  -- Cita 3 - Servicio 5 (Lavado Carmen): Champú + Acondicionador
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_5, v_prod_champu,         'Champú Reparador Résistance', 30, 'ml', 0.0520),
    (v_user_id, v_aptsvc_5, v_prod_acondicionador,  'Acondicionador Nutritive',    25, 'ml', 0.0680);

  -- Cita 4 - Servicio 6 (Corte Ana): Champú + Acondicionador + Sérum
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_6, v_prod_champu,         'Champú Reparador Résistance', 30, 'ml', 0.0520),
    (v_user_id, v_aptsvc_6, v_prod_acondicionador,  'Acondicionador Nutritive',    20, 'ml', 0.0680),
    (v_user_id, v_aptsvc_6, v_prod_serum,           'Sérum Protector Térmico',      5, 'ml', 0.1500);

  -- Cita 5 - Servicio 7 (Queratina Laura): Champú + Mascarilla + Ampolla x2 + Sérum + Aceite
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_7, v_prod_champu,     'Champú Reparador Résistance', 40, 'ml', 0.0520),
    (v_user_id, v_aptsvc_7, v_prod_mascarilla, 'Mascarilla Elixir Ultime',    80, 'ml', 0.0950),
    (v_user_id, v_aptsvc_7, v_prod_ampolla,    'Ampolla Botox Capilar',        2, 'unidades', 3.5000),
    (v_user_id, v_aptsvc_7, v_prod_serum,      'Sérum Protector Térmico',     15, 'ml', 0.1500),
    (v_user_id, v_aptsvc_7, v_prod_aceite,     'Aceite de Argán Moroccanoil', 15, 'ml', 0.2800);

  -- Cita 6 - Servicio 8 (Lavado Isabel): Champú + Acondicionador
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_8, v_prod_champu,         'Champú Reparador Résistance', 30, 'ml', 0.0520),
    (v_user_id, v_aptsvc_8, v_prod_acondicionador,  'Acondicionador Nutritive',    20, 'ml', 0.0680);

  -- Cita 6 - Servicio 9 (Peinado Isabel): Spray fijador
  insert into public.service_product_usage (user_id, appointment_service_id, product_id, product_name, quantity_used, unit, unit_cost_at_usage) values
    (v_user_id, v_aptsvc_9, v_prod_spray, 'Spray Fijador Elnett', 50, 'ml', 0.0300);

  raise notice '✅ Uso de productos en servicios insertado';

  -- ============================================================
  -- DESCONTAR STOCK DE PRODUCTOS CONSUMIDOS
  -- ============================================================
  -- Champú: 30+30+30+30+30+40+30 = 220 ml usados
  update public.products set current_stock = current_stock - 220 where id = v_prod_champu;
  -- Acondicionador: 20+25+20+20 = 85 ml usados
  update public.products set current_stock = current_stock - 85 where id = v_prod_acondicionador;
  -- Tinte: 80+40 = 120 ml usados
  update public.products set current_stock = current_stock - 120 where id = v_prod_tinte;
  -- Oxidante: 120+100 = 220 ml usados
  update public.products set current_stock = current_stock - 220 where id = v_prod_oxidante;
  -- Mascarilla: 50+80 = 130 ml usados
  update public.products set current_stock = current_stock - 130 where id = v_prod_mascarilla;
  -- Sérum: 10+5+15 = 30 ml usados
  update public.products set current_stock = current_stock - 30 where id = v_prod_serum;
  -- Spray: 50 ml usados
  update public.products set current_stock = current_stock - 50 where id = v_prod_spray;
  -- Ampollas: 1+2 = 3 unidades usadas
  update public.products set current_stock = current_stock - 3 where id = v_prod_ampolla;
  -- Decolorante: 60 gr usados
  update public.products set current_stock = current_stock - 60 where id = v_prod_decolorante;
  -- Aceite: 10+15 = 25 ml usados
  update public.products set current_stock = current_stock - 25 where id = v_prod_aceite;

  -- Registrar movimientos de uso en stock_movements
  insert into public.stock_movements (user_id, product_id, movement_type, quantity, notes) values
    (v_user_id, v_prod_champu,         'usage', 220, 'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_acondicionador, 'usage', 85,  'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_tinte,          'usage', 120, 'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_oxidante,       'usage', 220, 'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_mascarilla,     'usage', 130, 'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_serum,          'usage', 30,  'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_spray,          'usage', 50,  'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_ampolla,        'usage', 3,   'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_decolorante,    'usage', 60,  'Consumo acumulado servicios prestados'),
    (v_user_id, v_prod_aceite,         'usage', 25,  'Consumo acumulado servicios prestados');

  raise notice '✅ Stock de productos actualizado con consumos';

  -- ============================================================
  -- ACTUALIZAR TOTALES DE CITAS COMPLETADAS
  -- ============================================================

  -- Cita 1: María (35+65 = 100€ precio, costes calculados)
  update public.appointments
  set total_price = 100.00, total_cost = 56.54
  where id = v_cita_1;

  -- Cita 2: Sofía (85€ precio)
  update public.appointments
  set total_price = 85.00, total_cost = 57.50
  where id = v_cita_2;

  -- Cita 3: Carmen (40+18 = 58€ precio)
  update public.appointments
  set total_price = 58.00, total_cost = 30.81
  where id = v_cita_3;

  -- Cita 4: Ana (35€ precio)
  update public.appointments
  set total_price = 35.00, total_cost = 18.64
  where id = v_cita_4;

  -- Cita 5: Laura (120€ precio)
  update public.appointments
  set total_price = 120.00, total_cost = 64.10
  where id = v_cita_5;

  -- Cita 6: Isabel (18+35 = 53€ precio)
  update public.appointments
  set total_price = 53.00, total_cost = 20.96
  where id = v_cita_6;

  raise notice '✅ Totales de citas actualizados';

  -- ============================================================
  -- ENTRADAS DE TIEMPO
  -- ============================================================

  insert into public.time_entries (user_id, appointment_id, appointment_service_id, description, minutes_spent, hourly_cost, entry_date) values
    (v_user_id, v_cita_1, v_aptsvc_1, 'Corte señora - María García',          40,  18.00, (now() - interval '21 days')::date),
    (v_user_id, v_cita_1, v_aptsvc_2, 'Coloración completa - María García',   85,  18.00, (now() - interval '21 days')::date),
    (v_user_id, v_cita_2, v_aptsvc_3, 'Mechas balayage - Sofía Fernández',   130,  18.00, (now() - interval '14 days')::date),
    (v_user_id, v_cita_3, v_aptsvc_4, 'Tratamiento hidratante - Carmen M.',    45,  18.00, (now() - interval '10 days')::date),
    (v_user_id, v_cita_3, v_aptsvc_5, 'Lavado y secado - Carmen Moreno',       20,  18.00, (now() - interval '10 days')::date),
    (v_user_id, v_cita_4, v_aptsvc_6, 'Corte señora - Ana Rodríguez',          50,  18.00, (now() - interval '5 days')::date),
    (v_user_id, v_cita_5, v_aptsvc_7, 'Queratina completa - Laura Martín',    140,  18.00, (now() - interval '3 days')::date),
    (v_user_id, v_cita_6, v_aptsvc_8, 'Lavado semanal - Isabel Díaz',          25,  18.00, (now() - interval '1 day')::date),
    (v_user_id, v_cita_6, v_aptsvc_9, 'Peinado clásico - Isabel Díaz',         30,  18.00, (now() - interval '1 day')::date);

  raise notice '✅ 9 entradas de tiempo insertadas';
  raise notice '🎉 ¡Datos de ejemplo insertados correctamente! Ya puedes usar Aura Estudio.';

end $$;
