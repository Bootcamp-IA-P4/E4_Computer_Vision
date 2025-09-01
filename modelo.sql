-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brands (
  id bigint NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.detections (
  id bigint NOT NULL DEFAULT nextval('detections_id_seq'::regclass),
  file_id bigint NOT NULL,
  brand_id bigint NOT NULL,
  score numeric NOT NULL CHECK (score >= 0::numeric AND score <= 1::numeric),
  bbox jsonb,
  t_start numeric,
  t_end numeric,
  frame integer,
  model text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT detections_pkey PRIMARY KEY (id),
  CONSTRAINT detections_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT detections_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id)
);
CREATE TABLE public.files (
  id bigint NOT NULL DEFAULT nextval('files_id_seq'::regclass),
  bucket text NOT NULL,
  path text NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  duration_seconds integer,
  fps numeric,
  origin_video_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT files_pkey PRIMARY KEY (id),
  CONSTRAINT files_origin_video_id_fkey FOREIGN KEY (origin_video_id) REFERENCES public.files(id)
);
CREATE TABLE public.predictions (
  id bigint NOT NULL DEFAULT nextval('predictions_id_seq'::regclass),
  video_id bigint NOT NULL,
  brand_id bigint NOT NULL,
  total_seconds numeric NOT NULL CHECK (total_seconds >= 0::numeric),
  percentage numeric NOT NULL CHECK (percentage >= 0::numeric AND percentage <= 100::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT predictions_pkey PRIMARY KEY (id),
  CONSTRAINT predictions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT predictions_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.files(id)
);