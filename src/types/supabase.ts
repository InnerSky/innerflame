export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          id_categories_array: string[] | null
          image_url: string | null
          published: boolean | null
          slug: string | null
          title: string
          updated_at: string
          x_min_read: number | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          id_categories_array?: string[] | null
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          title: string
          updated_at?: string
          x_min_read?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          id_categories_array?: string[] | null
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          title?: string
          updated_at?: string
          x_min_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Categories_of_experience: {
        Row: {
          aka: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          aka?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          aka?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: string | null
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      entities: {
        Row: {
          content: string | null
          created_at: string | null
          entity_type: string
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_versions: {
        Row: {
          base_version_id: string | null
          changes: Json | null
          created_at: string | null
          created_by_message_id: string | null
          entity_id: string
          entity_type: string
          full_content: Json | null
          id: string
          is_current: boolean | null
          significance: string | null
          user_label: string | null
          version_number: number
          version_type: string
        }
        Insert: {
          base_version_id?: string | null
          changes?: Json | null
          created_at?: string | null
          created_by_message_id?: string | null
          entity_id: string
          entity_type: string
          full_content?: Json | null
          id?: string
          is_current?: boolean | null
          significance?: string | null
          user_label?: string | null
          version_number: number
          version_type?: string
        }
        Update: {
          base_version_id?: string | null
          changes?: Json | null
          created_at?: string | null
          created_by_message_id?: string | null
          entity_id?: string
          entity_type?: string
          full_content?: Json | null
          id?: string
          is_current?: boolean | null
          significance?: string | null
          user_label?: string | null
          version_number?: number
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_versions_base_version_id_fkey"
            columns: ["base_version_id"]
            isOneToOne: false
            referencedRelation: "entity_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_versions_created_by_message_id_fkey"
            columns: ["created_by_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          content: string | null
          created_at: string
          from_id_paragrphs_of_insights: number | null
          id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          from_id_paragrphs_of_insights?: number | null
          id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          from_id_paragrphs_of_insights?: number | null
          id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      message_references: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          message_id: string
          reference_type: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          message_id: string
          reference_type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          message_id?: string
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_references_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_tags: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          message_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          message_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          message_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_tags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_embedding: string | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          detected_intent: string[] | null
          display_thread_id: string | null
          has_proposed_changes: boolean | null
          id: string
          proposed_entity_changes: Json | null
          reply_to_message_id: string | null
          sender_type: string
          user_id: string
        }
        Insert: {
          content: string
          content_embedding?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          detected_intent?: string[] | null
          display_thread_id?: string | null
          has_proposed_changes?: boolean | null
          id?: string
          proposed_entity_changes?: Json | null
          reply_to_message_id?: string | null
          sender_type: string
          user_id: string
        }
        Update: {
          content?: string
          content_embedding?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          detected_intent?: string[] | null
          display_thread_id?: string | null
          has_proposed_changes?: boolean | null
          id?: string
          proposed_entity_changes?: Json | null
          reply_to_message_id?: string | null
          sender_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      paragraphs_of_insights: {
        Row: {
          created_at: string
          id: number
          processed: boolean
          text: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          processed?: boolean
          text?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          processed?: boolean
          text?: string | null
        }
        Relationships: []
      }
      resource: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          id: string | null
          title: string | null
          type: Database["public"]["Enums"]["resourceType"] | null
          url: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["resourceType"] | null
          url?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["resourceType"] | null
          url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      resourceType:
        | "deepResearch"
        | "article"
        | "book"
        | "youtubeVideo"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
