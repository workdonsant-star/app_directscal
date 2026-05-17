alter role authenticator set pgrst.db_schemas = 'public,next_auth';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
