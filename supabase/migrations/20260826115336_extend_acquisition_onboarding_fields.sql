update public.acquisition_campaign_fields
set order_index = case id
  when 'nome' then 0
  when 'email' then 1
  when 'whatsapp' then 2
  when 'tamanho_empresa' then 8
  else order_index
end
where id in ('nome', 'email', 'whatsapp', 'tamanho_empresa');

insert into public.acquisition_campaign_fields (
  campaign_id,
  id,
  label,
  type,
  required,
  placeholder,
  options,
  order_index
)
select
  campaign.id,
  field.id,
  field.label,
  field.type::public.acquisition_form_field_type,
  field.required,
  field.placeholder,
  field.options,
  field.order_index
from public.acquisition_campaigns as campaign
cross join (
  values
    (
      'cargo',
      'Posição na empresa',
      'select',
      true,
      null,
      '["Gerente", "Diretor", "Fundador", "CO-Fundador", "Sócio", "Líder"]'::jsonb,
      3
    ),
    (
      'nicho_atuacao',
      'Nicho de atuação',
      'text',
      true,
      'Ex.: educação, saúde, serviços financeiros',
      null::jsonb,
      4
    ),
    (
      'instagram_empresa',
      'Instagram da empresa',
      'text',
      true,
      '@empresa',
      null::jsonb,
      5
    ),
    (
      'website',
      'Website',
      'text',
      true,
      'empresa.com.br',
      null::jsonb,
      6
    ),
    (
      'cnpj',
      'CNPJ',
      'text',
      true,
      '00.000.000/0000-00',
      null::jsonb,
      7
    ),
    (
      'faturamento_ultimo_trimestre',
      'Faturamento último trimestre',
      'select',
      true,
      null,
      '["Até R$ 250 mil", "R$ 250 mil a R$ 500 mil", "R$ 500 mil a R$ 1 milhão", "R$ 1 milhão a R$ 2 milhões", "R$ 2 milhões a R$ 5 milhões", "R$ 5 milhões a R$ 10 milhões", "R$ 10 milhões a R$ 25 milhões", "Acima de R$ 25 milhões"]'::jsonb,
      9
    ),
    (
      'objetivo',
      'Fale um pouco sobre seus desafios',
      'textarea',
      true,
      'Descreva os principais desafios que a empresa enfrenta hoje.',
      null::jsonb,
      10
    )
) as field(id, label, type, required, placeholder, options, order_index)
on conflict (campaign_id, id) do update set
  label = excluded.label,
  type = excluded.type,
  required = excluded.required,
  placeholder = excluded.placeholder,
  options = excluded.options,
  order_index = excluded.order_index;

delete from public.acquisition_campaign_fields
where id = 'empresa';
