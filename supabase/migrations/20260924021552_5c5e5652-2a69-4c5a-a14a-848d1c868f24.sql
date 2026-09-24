CREATE TYPE public.book_status AS ENUM ('available', 'borrowed');
CREATE TYPE public.loan_status AS ENUM ('active', 'returned', 'overdue', 'renewed');

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  department text,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaborators read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Collaborators create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Collaborators update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  status public.book_status NOT NULL DEFAULT 'available',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books are publicly readable" ON public.books FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  book_id uuid NOT NULL REFERENCES public.books(id),
  checkout_date date NOT NULL DEFAULT current_date,
  checkout_time time NOT NULL DEFAULT localtime,
  due_date date NOT NULL,
  returned_at timestamptz,
  status public.loan_status NOT NULL DEFAULT 'active',
  renewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaborators read own loans" ON public.loans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Collaborators create own loans" ON public.loans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Collaborators update own loans" ON public.loans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER books_set_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loans_set_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_loan_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.due_date < NEW.checkout_date THEN
    RAISE EXCEPTION 'Due date cannot be before checkout date';
  END IF;
  IF NEW.renewed AND OLD.renewed THEN
    RAISE EXCEPTION 'Only one renewal is allowed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER loans_validate_dates BEFORE INSERT OR UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.validate_loan_dates();

CREATE INDEX books_category_id_idx ON public.books(category_id);
CREATE INDEX loans_user_id_idx ON public.loans(user_id);
CREATE INDEX loans_book_id_idx ON public.loans(book_id);
CREATE INDEX loans_due_date_idx ON public.loans(due_date);

INSERT INTO public.categories (id, name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Liderança'),
  ('22222222-2222-4222-8222-222222222222', 'Tecnologia'),
  ('33333333-3333-4333-8333-333333333333', 'Desenvolvimento'),
  ('44444444-4444-4444-8444-444444444444', 'Sustentabilidade');

INSERT INTO public.books (id, title, author, description, category_id, status, quantity) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Hábitos Atômicos', 'James Clear', 'Um método comprovado para criar bons hábitos, abandonar os maus e alcançar resultados extraordinários.', '33333333-3333-4333-8333-333333333333', 'available', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Essencialismo', 'Greg McKeown', 'Uma abordagem disciplinada para fazer menos, porém melhor, e concentrar energia no que realmente importa.', '33333333-3333-4333-8333-333333333333', 'available', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'Inteligência Emocional', 'Daniel Goleman', 'Uma exploração prática de como reconhecer e conduzir as emoções no trabalho e na vida.', '33333333-3333-4333-8333-333333333333', 'borrowed', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Comece pelo Porquê', 'Simon Sinek', 'Como grandes líderes inspiram pessoas a agir ao comunicar propósito antes de produtos ou processos.', '11111111-1111-4111-8111-111111111111', 'available', 1);