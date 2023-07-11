-- public.subscriptions definition

-- Drop table

-- DROP TABLE public.subscriptions;

CREATE TABLE public.subscriptions (
	id serial4 NOT NULL,
	resource_id uuid NOT NULL DEFAULT gen_random_uuid(),
	channel text NOT NULL,
	callback text NOT NULL,
	host text NOT NULL,
	active bool NULL DEFAULT true,
	failcount int4 NULL DEFAULT 0,
	CONSTRAINT subscriptions_pk PRIMARY KEY (id),
	CONSTRAINT subscriptions_un UNIQUE (channel, host)
);

-- Constraint subscriptions_un enforces a single subscription per channel and subscriber host as DDOS prevention.