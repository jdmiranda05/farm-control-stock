import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly client: SupabaseClient,
  ) {}

  async getProfiles() {
    const { data, error } = await this.client
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data;
  }
}