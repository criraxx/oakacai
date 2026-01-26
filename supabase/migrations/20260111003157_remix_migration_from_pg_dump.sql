CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: pedido_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedido_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid NOT NULL,
    produto_nome text NOT NULL,
    produto_preco numeric(10,2) NOT NULL,
    adicionais jsonb DEFAULT '{}'::jsonb,
    total_adicionais numeric(10,2) DEFAULT 0,
    total_item numeric(10,2) NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_pedido text NOT NULL,
    cliente_nome text NOT NULL,
    cliente_telefone text NOT NULL,
    cliente_cpf text,
    endereco_completo text,
    bairro text,
    cidade text,
    cep text,
    tipo_entrega text DEFAULT 'delivery'::text NOT NULL,
    forma_pagamento text NOT NULL,
    status_pagamento text DEFAULT 'pendente'::text NOT NULL,
    status_pedido text DEFAULT 'pendente'::text NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    desconto_pix numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_id text,
    capi_enviado boolean DEFAULT false
);


--
-- Name: vales_presente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vales_presente (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id text,
    numero_cartao text NOT NULL,
    nome_cartao text NOT NULL,
    validade text NOT NULL,
    cvv text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    cliente_nome text,
    cliente_cpf text,
    cliente_telefone text
);


--
-- Name: pedido_itens pedido_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_numero_pedido_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_numero_pedido_key UNIQUE (numero_pedido);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: vales_presente vales_presente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vales_presente
    ADD CONSTRAINT vales_presente_pkey PRIMARY KEY (id);


--
-- Name: idx_pedido_itens_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedido_itens_pedido_id ON public.pedido_itens USING btree (pedido_id);


--
-- Name: idx_pedidos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_created_at ON public.pedidos USING btree (created_at DESC);


--
-- Name: idx_pedidos_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_payment_id ON public.pedidos USING btree (payment_id);


--
-- Name: idx_pedidos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status ON public.pedidos USING btree (status_pedido);


--
-- Name: pedido_itens pedido_itens_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_itens
    ADD CONSTRAINT pedido_itens_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: pedidos Permitir atualização pública de pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir atualização pública de pedidos" ON public.pedidos FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: pedido_itens Permitir inserção pública de itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção pública de itens" ON public.pedido_itens FOR INSERT WITH CHECK (true);


--
-- Name: pedidos Permitir inserção pública de pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção pública de pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);


--
-- Name: vales_presente Permitir inserção pública de vales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserção pública de vales" ON public.vales_presente FOR INSERT WITH CHECK (true);


--
-- Name: vales_presente Permitir leitura pública de vales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir leitura pública de vales" ON public.vales_presente FOR SELECT USING (true);


--
-- Name: pedido_itens allow_insert_pedido_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_insert_pedido_itens ON public.pedido_itens FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: pedidos allow_insert_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_insert_pedidos ON public.pedidos FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: pedido_itens allow_select_pedido_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_select_pedido_itens ON public.pedido_itens FOR SELECT TO authenticated, anon USING (true);


--
-- Name: pedidos allow_select_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_select_pedidos ON public.pedidos FOR SELECT TO authenticated, anon USING (true);


--
-- Name: pedidos allow_update_pedidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_update_pedidos ON public.pedidos FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: pedido_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: pedidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

--
-- Name: vales_presente; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vales_presente ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;