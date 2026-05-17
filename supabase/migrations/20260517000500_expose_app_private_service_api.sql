alter role authenticator set pgrst.db_schemas = 'public,next_auth,app_private';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
