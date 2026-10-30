
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "birth_data": {
                  Row: {
                    "ascendant_source": string | null,"birth_date": string,"birth_place": string,"birth_time": string | null,"created_at": string,"declared_ascendant_sign": string | null,"id": string,"latitude": number,"longitude": number,"time_margin": string | null,"time_precision": string,"timezone": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ascendant_source"?: string | null,"birth_date": string,"birth_place": string,"birth_time"?: string | null,"created_at"?: string,"declared_ascendant_sign"?: string | null,"id"?: string,"latitude": number,"longitude": number,"time_margin"?: string | null,"time_precision"?: string,"timezone": string,"user_id": string
                  }
                  Update: {
                    "ascendant_source"?: string | null,"birth_date"?: string,"birth_place"?: string,"birth_time"?: string | null,"created_at"?: string,"declared_ascendant_sign"?: string | null,"id"?: string,"latitude"?: number,"longitude"?: number,"time_margin"?: string | null,"time_precision"?: string,"timezone"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"id": string,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"title"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"daily_horoscopes": {
                  Row: {
                    "content": string,"created_at": string,"factors": Json | null,"horoscope_date": string,"id": string,"model": string | null,"natal_chart_id": string,"prompt_version": string | null,"provider": string | null,"sections": Json | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"factors"?: Json | null,"horoscope_date": string,"id"?: string,"model"?: string | null,"natal_chart_id": string,"prompt_version"?: string | null,"provider"?: string | null,"sections"?: Json | null,"user_id": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"factors"?: Json | null,"horoscope_date"?: string,"id"?: string,"model"?: string | null,"natal_chart_id"?: string,"prompt_version"?: string | null,"provider"?: string | null,"sections"?: Json | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_horoscopes_natal_chart_id_fkey"
      columns: ["natal_chart_id"]
isOneToOne: false
      referencedRelation: "natal_charts"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "content": string,"conversation_id": string,"created_at": string,"factors": Json | null,"id": string,"model": string | null,"prompt_version": string | null,"provider": string | null,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"conversation_id": string,"created_at"?: string,"factors"?: Json | null,"id"?: string,"model"?: string | null,"prompt_version"?: string | null,"provider"?: string | null,"role": string
                  }
                  Update: {
                    "content"?: string,"conversation_id"?: string,"created_at"?: string,"factors"?: Json | null,"id"?: string,"model"?: string | null,"prompt_version"?: string | null,"provider"?: string | null,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"monthly_horoscopes": {
                  Row: {
                    "ascendant_sign": string | null,"cache_key": string,"created_at": string,"engine_version": string,"factors": NonNullable<Json>,"model": string,"month_start": string,"prompt_version": string,"provider": string,"sections": NonNullable<Json>,"sun_sign": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ascendant_sign"?: string | null,"cache_key": string,"created_at"?: string,"engine_version": string,"factors": NonNullable<Json>,"model": string,"month_start": string,"prompt_version": string,"provider": string,"sections": NonNullable<Json>,"sun_sign": string
                  }
                  Update: {
                    "ascendant_sign"?: string | null,"cache_key"?: string,"created_at"?: string,"engine_version"?: string,"factors"?: NonNullable<Json>,"model"?: string,"month_start"?: string,"prompt_version"?: string,"provider"?: string,"sections"?: NonNullable<Json>,"sun_sign"?: string
                  }
                  Relationships: [
                    
                  ]
                },"natal_charts": {
                  Row: {
                    "birth_data_id": string,"cache_key": string,"chart_data": NonNullable<Json>,"computed_at": string,"created_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_data_id": string,"cache_key": string,"chart_data": NonNullable<Json>,"computed_at"?: string,"created_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "birth_data_id"?: string,"cache_key"?: string,"chart_data"?: NonNullable<Json>,"computed_at"?: string,"created_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "natal_charts_birth_data_id_fkey"
      columns: ["birth_data_id"]
isOneToOne: false
      referencedRelation: "birth_data"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding_drafts": {
                  Row: {
                    "ascendant_source": string | null,"birth_data_id": string | null,"birth_date": string | null,"birth_place": string | null,"birth_time": string | null,"created_at": string,"current_step": number,"declared_ascendant_sign": string | null,"first_name": string | null,"latitude": number | null,"longitude": number | null,"time_margin": string | null,"time_precision": string | null,"timezone": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ascendant_source"?: string | null,"birth_data_id"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"birth_time"?: string | null,"created_at"?: string,"current_step"?: number,"declared_ascendant_sign"?: string | null,"first_name"?: string | null,"latitude"?: number | null,"longitude"?: number | null,"time_margin"?: string | null,"time_precision"?: string | null,"timezone"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "ascendant_source"?: string | null,"birth_data_id"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"birth_time"?: string | null,"created_at"?: string,"current_step"?: number,"declared_ascendant_sign"?: string | null,"first_name"?: string | null,"latitude"?: number | null,"longitude"?: number | null,"time_margin"?: string | null,"time_precision"?: string | null,"timezone"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_drafts_birth_data_id_fkey"
      columns: ["birth_data_id"]
isOneToOne: false
      referencedRelation: "birth_data"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"language": string,"status": string,"tone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"language"?: string,"status"?: string,"tone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"language"?: string,"status"?: string,"tone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"question_reservations": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at": string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"usage_counters": {
                  Row: {
                    "count": number,"created_at": string,"id": string,"period_start": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"created_at"?: string,"id"?: string,"period_start": string,"user_id": string
                  }
                  Update: {
                    "count"?: number,"created_at"?: string,"id"?: string,"period_start"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"weekly_horoscopes": {
                  Row: {
                    "ascendant_sign": string | null,"cache_key": string,"created_at": string,"engine_version": string,"factors": NonNullable<Json>,"model": string,"prompt_version": string,"provider": string,"sections": NonNullable<Json>,"sun_sign": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ascendant_sign"?: string | null,"cache_key": string,"created_at"?: string,"engine_version": string,"factors": NonNullable<Json>,"model": string,"prompt_version": string,"provider": string,"sections": NonNullable<Json>,"sun_sign": string,"week_start": string
                  }
                  Update: {
                    "ascendant_sign"?: string | null,"cache_key"?: string,"created_at"?: string,"engine_version"?: string,"factors"?: NonNullable<Json>,"model"?: string,"prompt_version"?: string,"provider"?: string,"sections"?: NonNullable<Json>,"sun_sign"?: string,"week_start"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "commit_question":
{ Args: { "p_reservation_id": string }; Returns: number
                           },
"complete_onboarding":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"consume_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"purge_rate_limits":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"question_count":
{ Args: { "p_user_id": string }; Returns: number
                           },
"record_answer":
{ Args: { "p_answer": string,"p_conversation_id": string,"p_factors": Json,"p_model": string,"p_prompt_version": string,"p_provider": string,"p_question": string,"p_user_id": string }; Returns: Json
                           },
"release_question":
{ Args: { "p_reservation_id": string }; Returns: undefined
                           },
"reserve_question":
{ Args: { "p_limit": number,"p_user_id": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
