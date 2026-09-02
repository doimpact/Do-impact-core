export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      a3_reports: {
        Row: {
          action_plan: string | null
          background: string | null
          company_id: string
          completed_at: string | null
          countermeasures: string | null
          created_at: string
          created_by: string | null
          current_condition: string | null
          followup: string | null
          goal: string | null
          id: string
          owner_id: string | null
          pillar_id: string | null
          problem_statement: string | null
          root_cause: string | null
          status: Database["public"]["Enums"]["a3_status"]
          title: string
          updated_at: string
        }
        Insert: {
          action_plan?: string | null
          background?: string | null
          company_id?: string
          completed_at?: string | null
          countermeasures?: string | null
          created_at?: string
          created_by?: string | null
          current_condition?: string | null
          followup?: string | null
          goal?: string | null
          id?: string
          owner_id?: string | null
          pillar_id?: string | null
          problem_statement?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["a3_status"]
          title: string
          updated_at?: string
        }
        Update: {
          action_plan?: string | null
          background?: string | null
          company_id?: string
          completed_at?: string | null
          countermeasures?: string | null
          created_at?: string
          created_by?: string | null
          current_condition?: string | null
          followup?: string | null
          goal?: string | null
          id?: string
          owner_id?: string | null
          pillar_id?: string | null
          problem_statement?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["a3_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "a3_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "a3_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "a3_reports_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          address: string | null
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          owner_id: string | null
          tier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addon_requests: {
        Row: {
          addon_key: string
          company_id: string | null
          contact_email: string | null
          created_at: string
          id: string
          note: string | null
          plan_key: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          addon_key: string
          company_id?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          note?: string | null
          plan_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          addon_key?: string
          company_id?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          note?: string | null
          plan_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          company_id: string | null
          created_at: string
          credits: number
          feature: string
          id: string
          input_tokens: number
          model: string | null
          output_tokens: number
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          credits?: number
          feature: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          credits?: number
          feature?: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_usage_limits: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          monthly_credits: number
          scope: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          monthly_credits?: number
          scope: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          monthly_credits?: number
          scope?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ampm_abnormalities: {
        Row: {
          can_run_safely: boolean
          closed_at: string | null
          company_id: string
          corrective_action: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          equipment_id: string | null
          found_by: string | null
          found_on: string
          id: string
          maintenance_assessment: string | null
          owner_name: string | null
          status: string
          tag_colour: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          can_run_safely?: boolean
          closed_at?: string | null
          company_id: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          equipment_id?: string | null
          found_by?: string | null
          found_on?: string
          id?: string
          maintenance_assessment?: string | null
          owner_name?: string | null
          status?: string
          tag_colour?: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          can_run_safely?: boolean
          closed_at?: string | null
          company_id?: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          equipment_id?: string | null
          found_by?: string | null
          found_on?: string
          id?: string
          maintenance_assessment?: string | null
          owner_name?: string | null
          status?: string
          tag_colour?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ampm_abnormalities_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_actions: {
        Row: {
          abnormality_id: string | null
          action: string
          breakdown_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          equipment_id: string | null
          id: string
          notes: string | null
          owner_name: string | null
          priority: number
          source_kind: string
          status: string
          updated_at: string
        }
        Insert: {
          abnormality_id?: string | null
          action: string
          breakdown_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          owner_name?: string | null
          priority?: number
          source_kind?: string
          status?: string
          updated_at?: string
        }
        Update: {
          abnormality_id?: string | null
          action?: string
          breakdown_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          owner_name?: string | null
          priority?: number
          source_kind?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_actions_abnormality_id_fkey"
            columns: ["abnormality_id"]
            isOneToOne: false
            referencedRelation: "ampm_abnormalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampm_actions_breakdown_id_fkey"
            columns: ["breakdown_id"]
            isOneToOne: false
            referencedRelation: "ampm_breakdowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampm_actions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_am_checks: {
        Row: {
          abnormality: string | null
          abnormality_found: boolean
          action_taken: string | null
          check_date: string
          company_id: string
          created_at: string
          created_by: string | null
          equipment_id: string | null
          id: string
          items: Json
          items_passed: number | null
          items_total: number | null
          notification_ref: string | null
          operator_name: string | null
          shift: string | null
          updated_at: string
        }
        Insert: {
          abnormality?: string | null
          abnormality_found?: boolean
          action_taken?: string | null
          check_date?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          id?: string
          items?: Json
          items_passed?: number | null
          items_total?: number | null
          notification_ref?: string | null
          operator_name?: string | null
          shift?: string | null
          updated_at?: string
        }
        Update: {
          abnormality?: string | null
          abnormality_found?: boolean
          action_taken?: string | null
          check_date?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          id?: string
          items?: Json
          items_passed?: number | null
          items_total?: number | null
          notification_ref?: string | null
          operator_name?: string | null
          shift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_am_checks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_breakdowns: {
        Row: {
          classification: string
          company_id: string
          corrective_action: string | null
          created_at: string
          created_by: string | null
          downtime_hours: number | null
          due_date: string | null
          equipment_id: string | null
          failure_mode: string | null
          id: string
          immediate_cause: string | null
          occurred_at: string
          owner_name: string | null
          parts_used: string | null
          permanent_fix: boolean
          repair_hours: number | null
          repeat_failure: boolean
          reported_by: string | null
          response_hours: number | null
          root_cause: string | null
          root_cause_required: boolean
          status: string
          temporary_fix: boolean
          updated_at: string
          verification: string | null
        }
        Insert: {
          classification?: string
          company_id: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          downtime_hours?: number | null
          due_date?: string | null
          equipment_id?: string | null
          failure_mode?: string | null
          id?: string
          immediate_cause?: string | null
          occurred_at?: string
          owner_name?: string | null
          parts_used?: string | null
          permanent_fix?: boolean
          repair_hours?: number | null
          repeat_failure?: boolean
          reported_by?: string | null
          response_hours?: number | null
          root_cause?: string | null
          root_cause_required?: boolean
          status?: string
          temporary_fix?: boolean
          updated_at?: string
          verification?: string | null
        }
        Update: {
          classification?: string
          company_id?: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          downtime_hours?: number | null
          due_date?: string | null
          equipment_id?: string | null
          failure_mode?: string | null
          id?: string
          immediate_cause?: string | null
          occurred_at?: string
          owner_name?: string | null
          parts_used?: string | null
          permanent_fix?: boolean
          repair_hours?: number | null
          repeat_failure?: boolean
          reported_by?: string | null
          response_hours?: number | null
          root_cause?: string | null
          root_cause_required?: boolean
          status?: string
          temporary_fix?: boolean
          updated_at?: string
          verification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ampm_breakdowns_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_equipment: {
        Row: {
          am_level: number
          am_program: string | null
          availability_pct: number | null
          backup_equipment: string | null
          company_id: string
          condition_rating: string
          created_at: string
          created_by: string | null
          critical_spares: string | null
          criticality: string
          department: string | null
          equipment_code: string | null
          failure_modes: string | null
          id: string
          installation_date: string | null
          last_pm: string | null
          location: string | null
          maintenance_owner: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_pm: string | null
          notes: string | null
          pm_program: string | null
          primary_operator: string | null
          process: string | null
          serial_number: string | null
          service_provider: string | null
          updated_at: string
        }
        Insert: {
          am_level?: number
          am_program?: string | null
          availability_pct?: number | null
          backup_equipment?: string | null
          company_id: string
          condition_rating?: string
          created_at?: string
          created_by?: string | null
          critical_spares?: string | null
          criticality?: string
          department?: string | null
          equipment_code?: string | null
          failure_modes?: string | null
          id?: string
          installation_date?: string | null
          last_pm?: string | null
          location?: string | null
          maintenance_owner?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_pm?: string | null
          notes?: string | null
          pm_program?: string | null
          primary_operator?: string | null
          process?: string | null
          serial_number?: string | null
          service_provider?: string | null
          updated_at?: string
        }
        Update: {
          am_level?: number
          am_program?: string | null
          availability_pct?: number | null
          backup_equipment?: string | null
          company_id?: string
          condition_rating?: string
          created_at?: string
          created_by?: string | null
          critical_spares?: string | null
          criticality?: string
          department?: string | null
          equipment_code?: string | null
          failure_modes?: string | null
          id?: string
          installation_date?: string | null
          last_pm?: string | null
          location?: string | null
          maintenance_owner?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_pm?: string | null
          notes?: string | null
          pm_program?: string | null
          primary_operator?: string | null
          process?: string | null
          serial_number?: string | null
          service_provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ampm_lubrication: {
        Row: {
          application_method: string | null
          company_id: string
          created_at: string
          created_by: string | null
          equipment_id: string | null
          frequency: string
          grade: string | null
          id: string
          last_done: string | null
          lubricant: string | null
          notes: string | null
          point_location: string
          quantity: string | null
          responsible: string | null
          updated_at: string
        }
        Insert: {
          application_method?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          frequency?: string
          grade?: string | null
          id?: string
          last_done?: string | null
          lubricant?: string | null
          notes?: string | null
          point_location: string
          quantity?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          application_method?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          frequency?: string
          grade?: string | null
          id?: string
          last_done?: string | null
          lubricant?: string | null
          notes?: string | null
          point_location?: string
          quantity?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_lubrication_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_pm_tasks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          downtime_required: boolean
          equipment_id: string | null
          estimated_hours: number | null
          frequency: string
          id: string
          last_completed: string | null
          next_due: string | null
          owner_name: string | null
          pm_type: string
          required_parts: string | null
          safety_requirements: string | null
          status: string
          task: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          downtime_required?: boolean
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency?: string
          id?: string
          last_completed?: string | null
          next_due?: string | null
          owner_name?: string | null
          pm_type?: string
          required_parts?: string | null
          safety_requirements?: string | null
          status?: string
          task: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          downtime_required?: boolean
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency?: string
          id?: string
          last_completed?: string | null
          next_due?: string | null
          owner_name?: string | null
          pm_type?: string
          required_parts?: string | null
          safety_requirements?: string | null
          status?: string
          task?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_pm_tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_spares: {
        Row: {
          alternate_part: string | null
          company_id: string
          created_at: string
          created_by: string | null
          criticality: string
          current_quantity: number | null
          description: string | null
          equipment_id: string | null
          id: string
          last_used: string | null
          lead_time_days: number | null
          min_quantity: number | null
          part_name: string
          part_number: string | null
          storage_location: string | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          alternate_part?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          criticality?: string
          current_quantity?: number | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          last_used?: string | null
          lead_time_days?: number | null
          min_quantity?: number | null
          part_name: string
          part_number?: string | null
          storage_location?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          alternate_part?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          criticality?: string
          current_quantity?: number | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          last_used?: string | null
          lead_time_days?: number | null
          min_quantity?: number | null
          part_name?: string
          part_number?: string | null
          storage_location?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_spares_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ampm_work_orders: {
        Row: {
          actual_date: string | null
          additional_repairs: string | null
          company_id: string
          created_at: string
          created_by: string | null
          equipment_id: string | null
          findings: string | null
          id: string
          labour_hours: number | null
          next_pm_due: string | null
          parts_replaced: string | null
          pm_task_id: string | null
          result: string
          scheduled_date: string | null
          status: string
          supervisor_verified: boolean
          technician: string | null
          updated_at: string
          wo_ref: string | null
          work_kind: string
        }
        Insert: {
          actual_date?: string | null
          additional_repairs?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          labour_hours?: number | null
          next_pm_due?: string | null
          parts_replaced?: string | null
          pm_task_id?: string | null
          result?: string
          scheduled_date?: string | null
          status?: string
          supervisor_verified?: boolean
          technician?: string | null
          updated_at?: string
          wo_ref?: string | null
          work_kind?: string
        }
        Update: {
          actual_date?: string | null
          additional_repairs?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          labour_hours?: number | null
          next_pm_due?: string | null
          parts_replaced?: string | null
          pm_task_id?: string | null
          result?: string
          scheduled_date?: string | null
          status?: string
          supervisor_verified?: boolean
          technician?: string | null
          updated_at?: string
          wo_ref?: string | null
          work_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampm_work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ampm_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampm_work_orders_pm_task_id_fkey"
            columns: ["pm_task_id"]
            isOneToOne: false
            referencedRelation: "ampm_pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      apqp_phase_items: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          evidence: string | null
          id: string
          label: string
          phase: number
          project_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          label: string
          phase: number
          project_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          label?: string
          phase?: number
          project_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apqp_phase_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apqp_phase_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "apqp_phase_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "apqp_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      apqp_projects: {
        Row: {
          account_id: string | null
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          current_phase: number
          customer: string | null
          id: string
          notes: string | null
          owner: string | null
          part_name: string | null
          part_number: string | null
          pfmea_study_id: string | null
          program: string | null
          status: string
          target_ppap_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_phase?: number
          customer?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          part_name?: string | null
          part_number?: string | null
          pfmea_study_id?: string | null
          program?: string | null
          status?: string
          target_ppap_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_phase?: number
          customer?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          part_name?: string | null
          part_number?: string | null
          pfmea_study_id?: string | null
          program?: string | null
          status?: string
          target_ppap_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apqp_projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apqp_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apqp_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "apqp_projects_pfmea_study_id_fkey"
            columns: ["pfmea_study_id"]
            isOneToOne: false
            referencedRelation: "pfmea_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_components: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          inbound_date: string | null
          inbound_po: string | null
          long_lead: boolean
          lot_serial: string | null
          part_number: string
          qty_allocated: number
          qty_on_hand: number
          qty_required: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          inbound_date?: string | null
          inbound_po?: string | null
          long_lead?: boolean
          lot_serial?: string | null
          part_number: string
          qty_allocated?: number
          qty_on_hand?: number
          qty_required?: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          inbound_date?: string | null
          inbound_po?: string | null
          long_lead?: boolean
          lot_serial?: string | null
          part_number?: string
          qty_allocated?: number
          qty_on_hand?: number
          qty_required?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_components_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_components_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_components_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "aps_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_downtime: {
        Row: {
          company_id: string
          created_at: string
          end_date: string
          hours: number | null
          id: string
          planned: boolean
          reason: string | null
          start_date: string
          updated_at: string
          work_center_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          end_date: string
          hours?: number | null
          id?: string
          planned?: boolean
          reason?: string | null
          start_date: string
          updated_at?: string
          work_center_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          end_date?: string
          hours?: number | null
          id?: string
          planned?: boolean
          reason?: string | null
          start_date?: string
          updated_at?: string
          work_center_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_downtime_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_downtime_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_downtime_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "aps_work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_operations: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_on_time: boolean | null
          created_at: string
          id: string
          name: string
          queue_minutes: number
          run_minutes: number
          seq: number
          setup_minutes: number
          status: string
          updated_at: string
          work_center_id: string | null
          work_order_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_on_time?: boolean | null
          created_at?: string
          id?: string
          name: string
          queue_minutes?: number
          run_minutes?: number
          seq?: number
          setup_minutes?: number
          status?: string
          updated_at?: string
          work_center_id?: string | null
          work_order_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_on_time?: boolean | null
          created_at?: string
          id?: string
          name?: string
          queue_minutes?: number
          run_minutes?: number
          seq?: number
          setup_minutes?: number
          status?: string
          updated_at?: string
          work_center_id?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_operations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_operations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_operations_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "aps_work_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_operations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "aps_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_scenario_changes: {
        Row: {
          change_type: string
          company_id: string
          created_at: string
          id: string
          note: string | null
          payload: Json
          scenario_id: string
          updated_at: string
          work_center_id: string | null
          work_order_id: string | null
        }
        Insert: {
          change_type: string
          company_id: string
          created_at?: string
          id?: string
          note?: string | null
          payload?: Json
          scenario_id: string
          updated_at?: string
          work_center_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          change_type?: string
          company_id?: string
          created_at?: string
          id?: string
          note?: string | null
          payload?: Json
          scenario_id?: string
          updated_at?: string
          work_center_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aps_scenario_changes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_scenario_changes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_scenario_changes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "aps_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_scenario_changes_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "aps_work_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_scenario_changes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "aps_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_scenarios: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          value_stream_id: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          value_stream_id: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          value_stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_scenarios_value_stream_id_fkey"
            columns: ["value_stream_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_schedule_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          created_by: string | null
          from_value: string | null
          id: string
          override: boolean
          reason: string | null
          to_value: string | null
          updated_at: string
          work_order_id: string | null
          zone: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          created_by?: string | null
          from_value?: string | null
          id?: string
          override?: boolean
          reason?: string | null
          to_value?: string | null
          updated_at?: string
          work_order_id?: string | null
          zone?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          from_value?: string | null
          id?: string
          override?: boolean
          reason?: string | null
          to_value?: string | null
          updated_at?: string
          work_order_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aps_schedule_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_schedule_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_schedule_log_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "aps_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_tooling: {
        Row: {
          archived_at: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          qty_available: number
          status: string
          updated_at: string
          value_stream_id: string | null
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          qty_available?: number
          status?: string
          updated_at?: string
          value_stream_id?: string | null
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          qty_available?: number
          status?: string
          updated_at?: string
          value_stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aps_tooling_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_tooling_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_tooling_value_stream_id_fkey"
            columns: ["value_stream_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_value_streams: {
        Row: {
          archived_at: string | null
          code: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_value_streams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_value_streams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_value_streams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_work_centers: {
        Row: {
          archived_at: string | null
          capacity_hours_per_shift: number
          code: string | null
          company_id: string
          created_at: string
          days_per_week: number
          efficiency_pct: number
          id: string
          name: string
          notes: string | null
          shifts_per_day: number
          sort_order: number
          staging_slots: number
          updated_at: string
          value_stream_id: string
        }
        Insert: {
          archived_at?: string | null
          capacity_hours_per_shift?: number
          code?: string | null
          company_id: string
          created_at?: string
          days_per_week?: number
          efficiency_pct?: number
          id?: string
          name: string
          notes?: string | null
          shifts_per_day?: number
          sort_order?: number
          staging_slots?: number
          updated_at?: string
          value_stream_id: string
        }
        Update: {
          archived_at?: string | null
          capacity_hours_per_shift?: number
          code?: string | null
          company_id?: string
          created_at?: string
          days_per_week?: number
          efficiency_pct?: number
          id?: string
          name?: string
          notes?: string | null
          shifts_per_day?: number
          sort_order?: number
          staging_slots?: number
          updated_at?: string
          value_stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aps_work_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_work_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_work_centers_value_stream_id_fkey"
            columns: ["value_stream_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      aps_work_orders: {
        Row: {
          archived_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          expedite: boolean
          family: string | null
          id: string
          kit_ready: boolean
          part_number: string
          priority: number
          qty: number
          released_at: string | null
          required_skill: string | null
          run_minutes_per_unit: number
          scheduled_start: string
          sequence: number
          setup_minutes: number
          source: string | null
          status: string
          tooling_id: string | null
          updated_at: string
          value_stream_id: string
          wo_number: string
          work_center_id: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          expedite?: boolean
          family?: string | null
          id?: string
          kit_ready?: boolean
          part_number: string
          priority?: number
          qty?: number
          released_at?: string | null
          required_skill?: string | null
          run_minutes_per_unit?: number
          scheduled_start: string
          sequence?: number
          setup_minutes?: number
          source?: string | null
          status?: string
          tooling_id?: string | null
          updated_at?: string
          value_stream_id: string
          wo_number: string
          work_center_id?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          expedite?: boolean
          family?: string | null
          id?: string
          kit_ready?: boolean
          part_number?: string
          priority?: number
          qty?: number
          released_at?: string | null
          required_skill?: string | null
          run_minutes_per_unit?: number
          scheduled_start?: string
          sequence?: number
          setup_minutes?: number
          source?: string | null
          status?: string
          tooling_id?: string | null
          updated_at?: string
          value_stream_id?: string
          wo_number?: string
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aps_work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "aps_work_orders_tooling_id_fkey"
            columns: ["tooling_id"]
            isOneToOne: false
            referencedRelation: "aps_tooling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_work_orders_value_stream_id_fkey"
            columns: ["value_stream_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aps_work_orders_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "aps_work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      bcm_actions: {
        Row: {
          action: string
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          exercise_id: string | null
          id: string
          incident_id: string | null
          notes: string | null
          owner_name: string | null
          risk_id: string | null
          source_kind: string
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          exercise_id?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          owner_name?: string | null
          risk_id?: string | null
          source_kind?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          exercise_id?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          owner_name?: string | null
          risk_id?: string | null
          source_kind?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bcm_actions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "bcm_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bcm_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "bcm_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bcm_actions_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "bcm_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      bcm_assets: {
        Row: {
          asset_kind: string
          company_id: string
          created_at: string
          created_by: string | null
          criticality: string
          department: string | null
          details: Json
          has_backup_strategy: boolean
          id: string
          last_tested: string | null
          name: string
          notes: string | null
          process: string | null
          recovery_strategy: string | null
          recovery_time_hours: number | null
          rpo_hours: number | null
          updated_at: string
        }
        Insert: {
          asset_kind: string
          company_id: string
          created_at?: string
          created_by?: string | null
          criticality?: string
          department?: string | null
          details?: Json
          has_backup_strategy?: boolean
          id?: string
          last_tested?: string | null
          name: string
          notes?: string | null
          process?: string | null
          recovery_strategy?: string | null
          recovery_time_hours?: number | null
          rpo_hours?: number | null
          updated_at?: string
        }
        Update: {
          asset_kind?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          criticality?: string
          department?: string | null
          details?: Json
          has_backup_strategy?: boolean
          id?: string
          last_tested?: string | null
          name?: string
          notes?: string | null
          process?: string | null
          recovery_strategy?: string | null
          recovery_time_hours?: number | null
          rpo_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bcm_exercises: {
        Row: {
          actual_actions: string | null
          company_id: string
          created_at: string
          created_by: string | null
          exercise_date: string
          exercise_type: string
          expected_actions: string | null
          id: string
          lessons_learned: string | null
          next_exercise: string | null
          objectives: string | null
          participants: string | null
          scenario: string | null
          title: string
          updated_at: string
          what_failed: string | null
          what_worked: string | null
        }
        Insert: {
          actual_actions?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          exercise_date?: string
          exercise_type?: string
          expected_actions?: string | null
          id?: string
          lessons_learned?: string | null
          next_exercise?: string | null
          objectives?: string | null
          participants?: string | null
          scenario?: string | null
          title: string
          updated_at?: string
          what_failed?: string | null
          what_worked?: string | null
        }
        Update: {
          actual_actions?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          exercise_date?: string
          exercise_type?: string
          expected_actions?: string | null
          id?: string
          lessons_learned?: string | null
          next_exercise?: string | null
          objectives?: string | null
          participants?: string | null
          scenario?: string | null
          title?: string
          updated_at?: string
          what_failed?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
      bcm_incidents: {
        Row: {
          activation_level: number
          closed_at: string | null
          communications: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_impact: string | null
          decisions: string | null
          description: string | null
          environmental_impact: string | null
          equipment_impact: string | null
          facility_impact: string | null
          final_resolution: string | null
          id: string
          immediate_actions: string | null
          incident_commander: string | null
          it_impact: string | null
          lessons_learned: string | null
          location: string | null
          occurred_at: string
          production_impact: string | null
          recovery_actions: string | null
          recovery_hours: number | null
          ref: string | null
          safety_impact: string | null
          status: string
          supply_chain_impact: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activation_level?: number
          closed_at?: string | null
          communications?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_impact?: string | null
          decisions?: string | null
          description?: string | null
          environmental_impact?: string | null
          equipment_impact?: string | null
          facility_impact?: string | null
          final_resolution?: string | null
          id?: string
          immediate_actions?: string | null
          incident_commander?: string | null
          it_impact?: string | null
          lessons_learned?: string | null
          location?: string | null
          occurred_at?: string
          production_impact?: string | null
          recovery_actions?: string | null
          recovery_hours?: number | null
          ref?: string | null
          safety_impact?: string | null
          status?: string
          supply_chain_impact?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activation_level?: number
          closed_at?: string | null
          communications?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_impact?: string | null
          decisions?: string | null
          description?: string | null
          environmental_impact?: string | null
          equipment_impact?: string | null
          facility_impact?: string | null
          final_resolution?: string | null
          id?: string
          immediate_actions?: string | null
          incident_commander?: string | null
          it_impact?: string | null
          lessons_learned?: string | null
          location?: string | null
          occurred_at?: string
          production_impact?: string | null
          recovery_actions?: string | null
          recovery_hours?: number | null
          ref?: string | null
          safety_impact?: string | null
          status?: string
          supply_chain_impact?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bcm_processes: {
        Row: {
          additional_actions: string | null
          bia_complete: boolean
          business_impact: string | null
          company_id: string
          created_at: string
          created_by: string | null
          critical_suppliers: string | null
          criticality: string
          current_backup: string | null
          customers_affected: string | null
          department: string | null
          dependencies: string | null
          employees_required: string | null
          equipment_required: string | null
          id: string
          it_systems: string | null
          materials: string | null
          minimum_operating_level: string | null
          mtd_hours: number | null
          process: string
          process_owner: string | null
          quality_regulatory_impact: string | null
          recovery_plan_complete: boolean
          rpo_hours: number | null
          rto_hours: number | null
          single_point_of_failure: string | null
          updated_at: string
          utilities: string | null
        }
        Insert: {
          additional_actions?: string | null
          bia_complete?: boolean
          business_impact?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          critical_suppliers?: string | null
          criticality?: string
          current_backup?: string | null
          customers_affected?: string | null
          department?: string | null
          dependencies?: string | null
          employees_required?: string | null
          equipment_required?: string | null
          id?: string
          it_systems?: string | null
          materials?: string | null
          minimum_operating_level?: string | null
          mtd_hours?: number | null
          process: string
          process_owner?: string | null
          quality_regulatory_impact?: string | null
          recovery_plan_complete?: boolean
          rpo_hours?: number | null
          rto_hours?: number | null
          single_point_of_failure?: string | null
          updated_at?: string
          utilities?: string | null
        }
        Update: {
          additional_actions?: string | null
          bia_complete?: boolean
          business_impact?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          critical_suppliers?: string | null
          criticality?: string
          current_backup?: string | null
          customers_affected?: string | null
          department?: string | null
          dependencies?: string | null
          employees_required?: string | null
          equipment_required?: string | null
          id?: string
          it_systems?: string | null
          materials?: string | null
          minimum_operating_level?: string | null
          mtd_hours?: number | null
          process?: string
          process_owner?: string | null
          quality_regulatory_impact?: string | null
          recovery_plan_complete?: boolean
          rpo_hours?: number | null
          rto_hours?: number | null
          single_point_of_failure?: string | null
          updated_at?: string
          utilities?: string | null
        }
        Relationships: []
      }
      bcm_risks: {
        Row: {
          affected_process: string | null
          category: string
          cause: string | null
          company_id: string
          consequence: string | null
          created_at: string
          created_by: string | null
          department: string | null
          due_date: string | null
          existing_controls: string | null
          id: string
          impact: number
          likelihood: number
          owner_name: string | null
          preventive_action: string | null
          process_id: string | null
          recovery_action: string | null
          ref: string | null
          residual_risk: string | null
          risk: string
          risk_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          affected_process?: string | null
          category?: string
          cause?: string | null
          company_id: string
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          due_date?: string | null
          existing_controls?: string | null
          id?: string
          impact?: number
          likelihood?: number
          owner_name?: string | null
          preventive_action?: string | null
          process_id?: string | null
          recovery_action?: string | null
          ref?: string | null
          residual_risk?: string | null
          risk: string
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          affected_process?: string | null
          category?: string
          cause?: string | null
          company_id?: string
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          due_date?: string | null
          existing_controls?: string | null
          id?: string
          impact?: number
          likelihood?: number
          owner_name?: string | null
          preventive_action?: string | null
          process_id?: string | null
          recovery_action?: string | null
          ref?: string | null
          residual_risk?: string | null
          risk?: string
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bcm_risks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "bcm_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_review_gates: {
        Row: {
          approver: string | null
          checklist: Json
          company_id: string
          created_at: string
          decided_on: string | null
          decision: string | null
          gate: number
          id: string
          notes: string | null
          review_id: string
          updated_at: string
        }
        Insert: {
          approver?: string | null
          checklist?: Json
          company_id?: string
          created_at?: string
          decided_on?: string | null
          decision?: string | null
          gate: number
          id?: string
          notes?: string | null
          review_id: string
          updated_at?: string
        }
        Update: {
          approver?: string | null
          checklist?: Json
          company_id?: string
          created_at?: string
          decided_on?: string | null
          decision?: string | null
          gate?: number
          id?: string
          notes?: string | null
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_review_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_review_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bid_review_gates_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "bid_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_review_items: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          detail: string | null
          due_date: string | null
          id: string
          impact: number | null
          kind: string
          owner_name: string | null
          probability: number | null
          ref: string | null
          review_id: string
          sort: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          data?: Json
          detail?: string | null
          due_date?: string | null
          id?: string
          impact?: number | null
          kind: string
          owner_name?: string | null
          probability?: number | null
          ref?: string | null
          review_id: string
          sort?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          detail?: string | null
          due_date?: string | null
          id?: string
          impact?: number | null
          kind?: string
          owner_name?: string | null
          probability?: number | null
          ref?: string | null
          review_id?: string
          sort?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_review_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_review_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bid_review_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "bid_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_reviews: {
        Row: {
          account_id: string | null
          archived: boolean
          bid_due_date: string | null
          capital_tooling: string | null
          company_id: string
          contract_id: string | null
          created_at: string
          currency: string
          current_gate: number
          customer_name: string | null
          est_revenue: number
          est_volume: string | null
          id: string
          notes: string | null
          opportunity_id: string | null
          owner_id: string | null
          owner_name: string | null
          product_program: string | null
          program_timing: string | null
          quote_id: string | null
          reference: string | null
          status: string
          strategic_rationale: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          archived?: boolean
          bid_due_date?: string | null
          capital_tooling?: string | null
          company_id?: string
          contract_id?: string | null
          created_at?: string
          currency?: string
          current_gate?: number
          customer_name?: string | null
          est_revenue?: number
          est_volume?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          product_program?: string | null
          program_timing?: string | null
          quote_id?: string | null
          reference?: string | null
          status?: string
          strategic_rationale?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          archived?: boolean
          bid_due_date?: string | null
          capital_tooling?: string | null
          company_id?: string
          contract_id?: string | null
          created_at?: string
          currency?: string
          current_gate?: number
          customer_name?: string | null
          est_revenue?: number
          est_volume?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          product_program?: string | null
          program_timing?: string | null
          quote_id?: string | null
          reference?: string | null
          status?: string
          strategic_rationale?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_reviews_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bid_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_reviews_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_reviews_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      board_report_layouts: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          layout: Json
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      booked_backlog: {
        Row: {
          amount: number
          company_id: string
          id: string
          month: number
          stream: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          company_id?: string
          id?: string
          month: number
          stream?: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          company_id?: string
          id?: string
          month?: number
          stream?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "booked_backlog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booked_backlog_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      business_health_reviews: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          created_by: string | null
          headline: string | null
          id: string
          narratives: Json
          period_label: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          headline?: string | null
          id?: string
          narratives?: Json
          period_label: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          headline?: string | null
          id?: string
          narratives?: Json
          period_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_health_templates: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          business_currency: string
          cost_baseline_monthly: number | null
          created_at: string | null
          entity_name: string
          id: string
          legal_address: string | null
          support_email: string
          updated_at: string | null
        }
        Insert: {
          business_currency?: string
          cost_baseline_monthly?: number | null
          created_at?: string | null
          entity_name?: string
          id?: string
          legal_address?: string | null
          support_email?: string
          updated_at?: string | null
        }
        Update: {
          business_currency?: string
          cost_baseline_monthly?: number | null
          created_at?: string | null
          entity_name?: string
          id?: string
          legal_address?: string | null
          support_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id: string
          notes: string | null
          pillar_id: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_date: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          notes?: string | null
          pillar_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          notes?: string | null
          pillar_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "calendar_events_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      capex_milestones: {
        Row: {
          capex_id: string
          company_id: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          gate: Database["public"]["Enums"]["capex_stage"]
          id: string
          notes: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          capex_id: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          gate?: Database["public"]["Enums"]["capex_stage"]
          id?: string
          notes?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          capex_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          gate?: Database["public"]["Enums"]["capex_stage"]
          id?: string
          notes?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capex_milestones_capex_id_fkey"
            columns: ["capex_id"]
            isOneToOne: false
            referencedRelation: "capex_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      capex_projects: {
        Row: {
          actual_cost: number
          actual_end: string | null
          actual_start: string | null
          approved_at: string | null
          archived_at: string | null
          audit_benefit_realization_pct: number | null
          audit_completed_at: string | null
          audit_due_date: string | null
          audit_notes: string | null
          audit_realized_savings: number | null
          business_unit: string | null
          category: string | null
          closed_at: string | null
          committed_cost: number
          company_id: string
          created_at: string
          currency: string
          description: string | null
          discount_rate_pct: number
          expected_annual_revenue: number
          expected_annual_savings: number
          health: Database["public"]["Enums"]["capex_health"]
          id: string
          install_start: string | null
          irr_pct: number | null
          linked_objective_id: string | null
          linked_theme_id: string | null
          npv: number | null
          number: string | null
          owner_id: string | null
          payback_months: number | null
          planned_end: string | null
          planned_start: string | null
          procurement_start: string | null
          progress: number
          risk_summary: string | null
          score_financial: number
          score_quality_defect: number
          score_safety: number
          score_strategic_fit: number
          score_sustainability: number
          score_throughput: number
          stage: Database["public"]["Enums"]["capex_stage"]
          status: Database["public"]["Enums"]["capex_status"]
          strategic_objective:
            | Database["public"]["Enums"]["capex_strategic_objective"]
            | null
          title: string
          total_cost: number
          total_score: number | null
          updated_at: string
          validation_start: string | null
        }
        Insert: {
          actual_cost?: number
          actual_end?: string | null
          actual_start?: string | null
          approved_at?: string | null
          archived_at?: string | null
          audit_benefit_realization_pct?: number | null
          audit_completed_at?: string | null
          audit_due_date?: string | null
          audit_notes?: string | null
          audit_realized_savings?: number | null
          business_unit?: string | null
          category?: string | null
          closed_at?: string | null
          committed_cost?: number
          company_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_rate_pct?: number
          expected_annual_revenue?: number
          expected_annual_savings?: number
          health?: Database["public"]["Enums"]["capex_health"]
          id?: string
          install_start?: string | null
          irr_pct?: number | null
          linked_objective_id?: string | null
          linked_theme_id?: string | null
          npv?: number | null
          number?: string | null
          owner_id?: string | null
          payback_months?: number | null
          planned_end?: string | null
          planned_start?: string | null
          procurement_start?: string | null
          progress?: number
          risk_summary?: string | null
          score_financial?: number
          score_quality_defect?: number
          score_safety?: number
          score_strategic_fit?: number
          score_sustainability?: number
          score_throughput?: number
          stage?: Database["public"]["Enums"]["capex_stage"]
          status?: Database["public"]["Enums"]["capex_status"]
          strategic_objective?:
            | Database["public"]["Enums"]["capex_strategic_objective"]
            | null
          title: string
          total_cost?: number
          total_score?: number | null
          updated_at?: string
          validation_start?: string | null
        }
        Update: {
          actual_cost?: number
          actual_end?: string | null
          actual_start?: string | null
          approved_at?: string | null
          archived_at?: string | null
          audit_benefit_realization_pct?: number | null
          audit_completed_at?: string | null
          audit_due_date?: string | null
          audit_notes?: string | null
          audit_realized_savings?: number | null
          business_unit?: string | null
          category?: string | null
          closed_at?: string | null
          committed_cost?: number
          company_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_rate_pct?: number
          expected_annual_revenue?: number
          expected_annual_savings?: number
          health?: Database["public"]["Enums"]["capex_health"]
          id?: string
          install_start?: string | null
          irr_pct?: number | null
          linked_objective_id?: string | null
          linked_theme_id?: string | null
          npv?: number | null
          number?: string | null
          owner_id?: string | null
          payback_months?: number | null
          planned_end?: string | null
          planned_start?: string | null
          procurement_start?: string | null
          progress?: number
          risk_summary?: string | null
          score_financial?: number
          score_quality_defect?: number
          score_safety?: number
          score_strategic_fit?: number
          score_sustainability?: number
          score_throughput?: number
          stage?: Database["public"]["Enums"]["capex_stage"]
          status?: Database["public"]["Enums"]["capex_status"]
          strategic_objective?:
            | Database["public"]["Enums"]["capex_strategic_objective"]
            | null
          title?: string
          total_cost?: number
          total_score?: number | null
          updated_at?: string
          validation_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capex_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "capex_projects_linked_objective_id_fkey"
            columns: ["linked_objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_projects_linked_theme_id_fkey"
            columns: ["linked_theme_id"]
            isOneToOne: false
            referencedRelation: "strategic_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      capex_value_realization: {
        Row: {
          capex_project_id: string
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          financial_impact: number | null
          id: string
          metric_name: string
          notes: string | null
          realized_result: string | null
          review_date: string | null
          review_phase: string | null
          status: string | null
          target_kpi: string | null
          updated_at: string
        }
        Insert: {
          capex_project_id: string
          category: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          financial_impact?: number | null
          id?: string
          metric_name: string
          notes?: string | null
          realized_result?: string | null
          review_date?: string | null
          review_phase?: string | null
          status?: string | null
          target_kpi?: string | null
          updated_at?: string
        }
        Update: {
          capex_project_id?: string
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          financial_impact?: number | null
          id?: string
          metric_name?: string
          notes?: string | null
          realized_result?: string | null
          review_date?: string | null
          review_phase?: string | null
          status?: string | null
          target_kpi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capex_value_realization_capex_project_id_fkey"
            columns: ["capex_project_id"]
            isOneToOne: false
            referencedRelation: "capex_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_value_realization_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capex_value_realization_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cash_flow_settings: {
        Row: {
          anchor_week: string
          company_id: string
          created_at: string
          currency: string
          id: string
          monthly_revenue: number | null
          name: string
          notes: string | null
          opening_balance: number
          updated_at: string
        }
        Insert: {
          anchor_week?: string
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          monthly_revenue?: number | null
          name?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          anchor_week?: string
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          monthly_revenue?: number | null
          name?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cash_flow_weeks: {
        Row: {
          actual: number
          category: string
          company_id: string
          created_at: string
          id: string
          line_key: string
          line_label: string
          notes: string | null
          plan: number
          settings_id: string | null
          sort_order: number
          updated_at: string
          week_start_date: string
        }
        Insert: {
          actual?: number
          category: string
          company_id?: string
          created_at?: string
          id?: string
          line_key: string
          line_label: string
          notes?: string | null
          plan?: number
          settings_id?: string | null
          sort_order?: number
          updated_at?: string
          week_start_date: string
        }
        Update: {
          actual?: number
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          line_key?: string
          line_label?: string
          notes?: string | null
          plan?: number
          settings_id?: string | null
          sort_order?: number
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_weeks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_weeks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cash_flow_weeks_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "cash_flow_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          authority: string | null
          cert_number: string | null
          company_id: string
          created_at: string
          document_url: string | null
          employee_id: string
          expires_on: string | null
          id: string
          issued_on: string | null
          name: string
          notes: string | null
          skill_id: string | null
          updated_at: string
        }
        Insert: {
          authority?: string | null
          cert_number?: string | null
          company_id?: string
          created_at?: string
          document_url?: string | null
          employee_id: string
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          name: string
          notes?: string | null
          skill_id?: string | null
          updated_at?: string
        }
        Update: {
          authority?: string | null
          cert_number?: string | null
          company_id?: string
          created_at?: string
          document_url?: string | null
          employee_id?: string
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          name?: string
          notes?: string | null
          skill_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      cld_diagrams: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          links: Json
          loop_notes: Json
          nodes: Json
          owner_id: string | null
          phases: Json
          plan_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          links?: Json
          loop_notes?: Json
          nodes?: Json
          owner_id?: string | null
          phases?: Json
          plan_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          links?: Json
          loop_notes?: Json
          nodes?: Json
          owner_id?: string | null
          phases?: Json
          plan_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cld_diagrams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cld_diagrams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cld_diagrams_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          is_template: boolean | null
          landing_path: string | null
          name: string
          pending_checkout: boolean
          referrer_host: string | null
          slug: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          landing_path?: string | null
          name: string
          pending_checkout?: boolean
          referrer_host?: string | null
          slug?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          landing_path?: string | null
          name?: string
          pending_checkout?: boolean
          referrer_host?: string | null
          slug?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      company_addons: {
        Row: {
          activated_at: string
          addon_key: string
          cancel_at_period_end: boolean
          company_id: string
          created_at: string
          custom_price: number | null
          discount_amount: number | null
          discount_pct: number | null
          environment: string
          id: string
          list_price: number | null
          monthly_credit_cap: number | null
          price_note: string | null
          pricing_mode: string
          status: string
          term_end: string | null
          term_start: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          addon_key: string
          cancel_at_period_end?: boolean
          company_id: string
          created_at?: string
          custom_price?: number | null
          discount_amount?: number | null
          discount_pct?: number | null
          environment?: string
          id?: string
          list_price?: number | null
          monthly_credit_cap?: number | null
          price_note?: string | null
          pricing_mode?: string
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          addon_key?: string
          cancel_at_period_end?: boolean
          company_id?: string
          created_at?: string
          custom_price?: number | null
          discount_amount?: number | null
          discount_pct?: number | null
          environment?: string
          id?: string
          list_price?: number | null
          monthly_credit_cap?: number | null
          price_note?: string | null
          pricing_mode?: string
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_addons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_addons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_billing: {
        Row: {
          cancel_at_period_end: boolean
          company_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          item_key: string | null
          kind: string
          price_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          company_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          item_key?: string | null
          kind?: string
          price_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          item_key?: string | null
          kind?: string
          price_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_invites: {
        Row: {
          accepted_at: string | null
          access_level: Database["public"]["Enums"]["access_level"]
          allowed_modules: string[] | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          allowed_modules?: string[] | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          access_level?: Database["public"]["Enums"]["access_level"]
          allowed_modules?: string[] | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_members: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          allowed_modules: string[] | null
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          allowed_modules?: string[] | null
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          allowed_modules?: string[] | null
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          billing_period: string
          cancel_at_period_end: boolean
          company_id: string
          created_at: string
          currency: string
          custom_price: number | null
          discount_amount: number | null
          discount_pct: number | null
          environment: string
          id: string
          list_price: number | null
          plan_key: string
          price_note: string | null
          pricing_mode: string
          seats: number | null
          status: string
          term_end: string | null
          term_start: string
          updated_at: string
        }
        Insert: {
          billing_period?: string
          cancel_at_period_end?: boolean
          company_id: string
          created_at?: string
          currency?: string
          custom_price?: number | null
          discount_amount?: number | null
          discount_pct?: number | null
          environment?: string
          id?: string
          list_price?: number | null
          plan_key?: string
          price_note?: string | null
          pricing_mode?: string
          seats?: number | null
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
        }
        Update: {
          billing_period?: string
          cancel_at_period_end?: boolean
          company_id?: string
          created_at?: string
          currency?: string
          custom_price?: number | null
          discount_amount?: number | null
          discount_pct?: number | null
          environment?: string
          id?: string
          list_price?: number | null
          plan_key?: string
          price_note?: string | null
          pricing_mode?: string
          seats?: number | null
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      compliance_snapshots: {
        Row: {
          audit_date: string | null
          auditor: string | null
          checked_items: number
          company_id: string
          created_at: string
          created_by: string
          created_by_email: string | null
          framework: string
          id: string
          label: string | null
          percent: number
          state: Json
          total_items: number
        }
        Insert: {
          audit_date?: string | null
          auditor?: string | null
          checked_items?: number
          company_id?: string
          created_at?: string
          created_by?: string
          created_by_email?: string | null
          framework?: string
          id?: string
          label?: string | null
          percent?: number
          state?: Json
          total_items?: number
        }
        Update: {
          audit_date?: string | null
          auditor?: string | null
          checked_items?: number
          company_id?: string
          created_at?: string
          created_by?: string
          created_by_email?: string | null
          framework?: string
          id?: string
          label?: string | null
          percent?: number
          state?: Json
          total_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      consolidation_baseline_costs: {
        Row: {
          as_is_annual: number
          bucket: Database["public"]["Enums"]["consolidation_bucket"]
          category: string
          company_id: string
          created_at: string
          id: string
          note: string | null
          project_id: string
          sort_order: number
          to_be_annual: number
          updated_at: string
        }
        Insert: {
          as_is_annual?: number
          bucket: Database["public"]["Enums"]["consolidation_bucket"]
          category: string
          company_id: string
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          sort_order?: number
          to_be_annual?: number
          updated_at?: string
        }
        Update: {
          as_is_annual?: number
          bucket?: Database["public"]["Enums"]["consolidation_bucket"]
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          sort_order?: number
          to_be_annual?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_baseline_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_baseline_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consolidation_baseline_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "consolidation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_monthly_entries: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          id: string
          kind: string
          label: string
          month: string
          note: string | null
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          company_id: string
          created_at?: string
          id?: string
          kind: string
          label?: string
          month: string
          note?: string | null
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          kind?: string
          label?: string
          month?: string
          note?: string | null
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_monthly_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_monthly_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consolidation_monthly_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "consolidation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_phases: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          project_id: string
          sort_order: number
          start_date: string | null
          status: Database["public"]["Enums"]["consolidation_phase_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          project_id: string
          sort_order: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["consolidation_phase_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          project_id?: string
          sort_order?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["consolidation_phase_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consolidation_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "consolidation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_pnl_entries: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          line: string
          month: string
          note: string | null
          project_id: string
          scenario: string
          site: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          id?: string
          line: string
          month: string
          note?: string | null
          project_id: string
          scenario: string
          site?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          line?: string
          month?: string
          note?: string | null
          project_id?: string
          scenario?: string
          site?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_pnl_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_pnl_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consolidation_pnl_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "consolidation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_projects: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          discount_rate_pct: number
          from_site_a: string | null
          from_site_b: string | null
          id: string
          name: string
          owner_id: string | null
          status: Database["public"]["Enums"]["consolidation_status"]
          target_go_live: string | null
          to_site: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          discount_rate_pct?: number
          from_site_a?: string | null
          from_site_b?: string | null
          id?: string
          name: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["consolidation_status"]
          target_go_live?: string | null
          to_site?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          discount_rate_pct?: number
          from_site_a?: string | null
          from_site_b?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["consolidation_status"]
          target_go_live?: string | null
          to_site?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      consolidation_transition_costs: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["consolidation_transition_cat"]
          company_id: string
          created_at: string
          id: string
          label: string
          note: string | null
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number
          category: Database["public"]["Enums"]["consolidation_transition_cat"]
          company_id: string
          created_at?: string
          id?: string
          label: string
          note?: string | null
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["consolidation_transition_cat"]
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          note?: string | null
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_transition_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_transition_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "consolidation_transition_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "consolidation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string
          archived_at: string | null
          company_id: string
          created_at: string
          decision_role: string | null
          email: string | null
          id: string
          influence: string | null
          is_primary: boolean
          name: string
          notes: string | null
          phone: string | null
          relationship_owner_id: string | null
          relationship_strength: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          archived_at?: string | null
          company_id?: string
          created_at?: string
          decision_role?: string | null
          email?: string | null
          id?: string
          influence?: string | null
          is_primary?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          relationship_owner_id?: string | null
          relationship_strength?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          archived_at?: string | null
          company_id?: string
          created_at?: string
          decision_role?: string | null
          email?: string | null
          id?: string
          influence?: string | null
          is_primary?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          relationship_owner_id?: string | null
          relationship_strength?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_relationship_owner_id_fkey"
            columns: ["relationship_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          account_id: string
          company_id: string
          contact_id: string | null
          contract_number: string | null
          created_at: string
          currency: string
          document_url: string | null
          end_date: string | null
          id: string
          notes: string | null
          owner_id: string | null
          signed_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          account_id: string
          company_id?: string
          contact_id?: string | null
          contract_number?: string | null
          created_at?: string
          currency?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          signed_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          account_id?: string
          company_id?: string
          contact_id?: string | null
          contract_number?: string | null
          created_at?: string
          currency?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          signed_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copq_entries: {
        Row: {
          capex_project_id: string | null
          category: string
          company_id: string
          corrective_action: string | null
          cost: number
          created_at: string
          currency: string
          description: string | null
          id: string
          month: string
          owner_id: string | null
          part_number: string | null
          quantity: number
          root_cause: string | null
          status: string
          updated_at: string
        }
        Insert: {
          capex_project_id?: string | null
          category: string
          company_id?: string
          corrective_action?: string | null
          cost?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          month: string
          owner_id?: string | null
          part_number?: string | null
          quantity?: number
          root_cause?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          capex_project_id?: string | null
          category?: string
          company_id?: string
          corrective_action?: string | null
          cost?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          month?: string
          owner_id?: string | null
          part_number?: string | null
          quantity?: number
          root_cause?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copq_entries_capex_project_id_fkey"
            columns: ["capex_project_id"]
            isOneToOne: false
            referencedRelation: "capex_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copq_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copq_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cpp_blockers: {
        Row: {
          blocker_type: string
          cleared_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          raised_at: string
          responded_at: string | null
          support_function: string
          target_response_minutes: number
          task_id: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          blocker_type?: string
          cleared_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          raised_at?: string
          responded_at?: string | null
          support_function?: string
          target_response_minutes?: number
          task_id?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          blocker_type?: string
          cleared_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          raised_at?: string
          responded_at?: string | null
          support_function?: string
          target_response_minutes?: number
          task_id?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpp_blockers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_blockers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cpp_blockers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cpp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_blockers_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "cpp_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      cpp_handovers: {
        Row: {
          blockers_carried: string | null
          cards_reviewed: string | null
          company_id: string
          created_at: string
          handover_date: string
          id: string
          incoming_lead: string | null
          kit_note: string | null
          kit_readiness: string
          next_priorities: string | null
          outgoing_lead: string | null
          shift_label: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          blockers_carried?: string | null
          cards_reviewed?: string | null
          company_id: string
          created_at?: string
          handover_date?: string
          id?: string
          incoming_lead?: string | null
          kit_note?: string | null
          kit_readiness?: string
          next_priorities?: string | null
          outgoing_lead?: string | null
          shift_label?: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          blockers_carried?: string | null
          cards_reviewed?: string | null
          company_id?: string
          created_at?: string
          handover_date?: string
          id?: string
          incoming_lead?: string | null
          kit_note?: string | null
          kit_readiness?: string
          next_priorities?: string | null
          outgoing_lead?: string | null
          shift_label?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpp_handovers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_handovers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cpp_handovers_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "cpp_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      cpp_pulse_checks: {
        Row: {
          check_at: string
          company_id: string
          created_at: string
          earned_hours: number
          id: string
          note: string | null
          planned_hours: number
          stopped_over_15min: boolean
          updated_at: string
          visit_id: string
          window_hours: number
        }
        Insert: {
          check_at?: string
          company_id: string
          created_at?: string
          earned_hours?: number
          id?: string
          note?: string | null
          planned_hours?: number
          stopped_over_15min?: boolean
          updated_at?: string
          visit_id: string
          window_hours?: number
        }
        Update: {
          check_at?: string
          company_id?: string
          created_at?: string
          earned_hours?: number
          id?: string
          note?: string | null
          planned_hours?: number
          stopped_over_15min?: boolean
          updated_at?: string
          visit_id?: string
          window_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "cpp_pulse_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_pulse_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cpp_pulse_checks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "cpp_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      cpp_tasks: {
        Row: {
          company_id: string
          created_at: string
          earned_hours: number
          id: string
          non_routine_type: string | null
          on_critical_path: boolean
          owner_name: string | null
          planned_hours: number
          predecessor_id: string | null
          red_tagged: boolean
          reevaluated_at: string | null
          reevaluation_note: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
          visit_id: string
          work_area: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          earned_hours?: number
          id?: string
          non_routine_type?: string | null
          on_critical_path?: boolean
          owner_name?: string | null
          planned_hours?: number
          predecessor_id?: string | null
          red_tagged?: boolean
          reevaluated_at?: string | null
          reevaluation_note?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          visit_id: string
          work_area?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          earned_hours?: number
          id?: string
          non_routine_type?: string | null
          on_critical_path?: boolean
          owner_name?: string | null
          planned_hours?: number
          predecessor_id?: string | null
          red_tagged?: boolean
          reevaluated_at?: string | null
          reevaluation_note?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          visit_id?: string
          work_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpp_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "cpp_tasks_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "cpp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_tasks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "cpp_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      cpp_visits: {
        Row: {
          aircraft_reg: string
          aircraft_type: string | null
          archived_at: string | null
          bay: string | null
          check_type: string | null
          company_id: string
          created_at: string
          id: string
          induction_date: string | null
          notes: string | null
          planned_redelivery: string | null
          status: string
          total_planned_hours: number
          updated_at: string
        }
        Insert: {
          aircraft_reg: string
          aircraft_type?: string | null
          archived_at?: string | null
          bay?: string | null
          check_type?: string | null
          company_id: string
          created_at?: string
          id?: string
          induction_date?: string | null
          notes?: string | null
          planned_redelivery?: string | null
          status?: string
          total_planned_hours?: number
          updated_at?: string
        }
        Update: {
          aircraft_reg?: string
          aircraft_type?: string | null
          archived_at?: string | null
          bay?: string | null
          check_type?: string | null
          company_id?: string
          created_at?: string
          id?: string
          induction_date?: string | null
          notes?: string | null
          planned_redelivery?: string | null
          status?: string
          total_planned_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpp_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpp_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      demo_leads: {
        Row: {
          email: string
          first_seen_at: string
          gbraid: string | null
          gclid: string | null
          id: string
          landing_path: string | null
          landing_variant: string | null
          last_seen_at: string
          referrer_host: string | null
          source: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visits: number
          wbraid: string | null
        }
        Insert: {
          email: string
          first_seen_at?: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          landing_path?: string | null
          landing_variant?: string | null
          last_seen_at?: string
          referrer_host?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visits?: number
          wbraid?: string | null
        }
        Update: {
          email?: string
          first_seen_at?: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          landing_path?: string | null
          landing_variant?: string | null
          last_seen_at?: string
          referrer_host?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visits?: number
          wbraid?: string | null
        }
        Relationships: []
      }
      development_plans: {
        Row: {
          action_id: string | null
          company_id: string
          created_at: string
          current_level: number
          employee_id: string
          id: string
          notes: string | null
          skill_id: string
          status: string
          target_date: string | null
          target_level: number
          updated_at: string
        }
        Insert: {
          action_id?: string | null
          company_id?: string
          created_at?: string
          current_level?: number
          employee_id: string
          id?: string
          notes?: string | null
          skill_id: string
          status?: string
          target_date?: string | null
          target_level: number
          updated_at?: string
        }
        Update: {
          action_id?: string | null
          company_id?: string
          created_at?: string
          current_level?: number
          employee_id?: string
          id?: string
          notes?: string | null
          skill_id?: string
          status?: string
          target_date?: string | null
          target_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "training_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "development_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_boards: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_boards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_boards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dm_categories: {
        Row: {
          accent: string
          archived_at: string | null
          company_id: string
          created_at: string
          icon: string
          id: string
          key: string
          label: string
          sort_order: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          accent?: string
          archived_at?: string | null
          company_id: string
          created_at?: string
          icon?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          accent?: string
          archived_at?: string | null
          company_id?: string
          created_at?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dm_category_targets: {
        Row: {
          actual_value: number | null
          board_id: string
          category_key: string
          company_id: string
          created_at: string
          id: string
          plan_value: number | null
          updated_at: string
          value_date: string
        }
        Insert: {
          actual_value?: number | null
          board_id: string
          category_key: string
          company_id: string
          created_at?: string
          id?: string
          plan_value?: number | null
          updated_at?: string
          value_date: string
        }
        Update: {
          actual_value?: number | null
          board_id?: string
          category_key?: string
          company_id?: string
          created_at?: string
          id?: string
          plan_value?: number | null
          updated_at?: string
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_category_targets_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_category_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_category_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dm_escalations: {
        Row: {
          a3_report_id: string | null
          archived_at: string | null
          board_id: string
          category: string
          cause: string | null
          company_id: string
          concern: string
          countermeasure: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          escalated: boolean
          id: string
          loop_state: Database["public"]["Enums"]["dm_loop_state"]
          mark_id: string | null
          metric_def_id: string | null
          occurred_on: string
          owner_id: string | null
          recurrence_count: number
          standardised_at: string | null
          standardised_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          a3_report_id?: string | null
          archived_at?: string | null
          board_id: string
          category: string
          cause?: string | null
          company_id?: string
          concern: string
          countermeasure?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          escalated?: boolean
          id?: string
          loop_state?: Database["public"]["Enums"]["dm_loop_state"]
          mark_id?: string | null
          metric_def_id?: string | null
          occurred_on: string
          owner_id?: string | null
          recurrence_count?: number
          standardised_at?: string | null
          standardised_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          a3_report_id?: string | null
          archived_at?: string | null
          board_id?: string
          category?: string
          cause?: string | null
          company_id?: string
          concern?: string
          countermeasure?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          escalated?: boolean
          id?: string
          loop_state?: Database["public"]["Enums"]["dm_loop_state"]
          mark_id?: string | null
          metric_def_id?: string | null
          occurred_on?: string
          owner_id?: string | null
          recurrence_count?: number
          standardised_at?: string | null
          standardised_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_escalations_a3_report_id_fkey"
            columns: ["a3_report_id"]
            isOneToOne: false
            referencedRelation: "a3_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_escalations_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_escalations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_escalations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "dm_escalations_mark_id_fkey"
            columns: ["mark_id"]
            isOneToOne: false
            referencedRelation: "dm_marks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_escalations_metric_def_id_fkey"
            columns: ["metric_def_id"]
            isOneToOne: false
            referencedRelation: "dm_metric_defs"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_gemba_items: {
        Row: {
          company_id: string
          created_at: string
          depth_score: number | null
          escalation_id: string | null
          id: string
          label: string | null
          metric_def_id: string | null
          note: string | null
          objective_id: string | null
          sort_order: number
          updated_at: string
          walk_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          depth_score?: number | null
          escalation_id?: string | null
          id?: string
          label?: string | null
          metric_def_id?: string | null
          note?: string | null
          objective_id?: string | null
          sort_order?: number
          updated_at?: string
          walk_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          depth_score?: number | null
          escalation_id?: string | null
          id?: string
          label?: string | null
          metric_def_id?: string | null
          note?: string | null
          objective_id?: string | null
          sort_order?: number
          updated_at?: string
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_gemba_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "dm_gemba_items_escalation_id_fkey"
            columns: ["escalation_id"]
            isOneToOne: false
            referencedRelation: "dm_escalations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_items_metric_def_id_fkey"
            columns: ["metric_def_id"]
            isOneToOne: false
            referencedRelation: "dm_metric_defs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_items_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_items_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "dm_gemba_walks"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_gemba_walks: {
        Row: {
          avg_depth: number | null
          board_id: string
          company_id: string
          created_at: string
          id: string
          leader_id: string | null
          notes: string | null
          updated_at: string
          walked_on: string
        }
        Insert: {
          avg_depth?: number | null
          board_id: string
          company_id: string
          created_at?: string
          id?: string
          leader_id?: string | null
          notes?: string | null
          updated_at?: string
          walked_on?: string
        }
        Update: {
          avg_depth?: number | null
          board_id?: string
          company_id?: string
          created_at?: string
          id?: string
          leader_id?: string | null
          notes?: string | null
          updated_at?: string
          walked_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_gemba_walks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_walks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_gemba_walks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dm_marks: {
        Row: {
          board_id: string
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          mark_date: string
          note: string | null
          reason_code_id: string | null
          status: Database["public"]["Enums"]["dm_status"]
          updated_at: string
        }
        Insert: {
          board_id: string
          category: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mark_date: string
          note?: string | null
          reason_code_id?: string | null
          status: Database["public"]["Enums"]["dm_status"]
          updated_at?: string
        }
        Update: {
          board_id?: string
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mark_date?: string
          note?: string | null
          reason_code_id?: string | null
          status?: Database["public"]["Enums"]["dm_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_marks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_marks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_marks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "dm_marks_reason_code_id_fkey"
            columns: ["reason_code_id"]
            isOneToOne: false
            referencedRelation: "dm_reason_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_metric_defs: {
        Row: {
          active: boolean
          archived_at: string | null
          board_id: string
          company_id: string
          created_at: string
          direction: Database["public"]["Enums"]["dm_metric_direction"]
          id: string
          key: string
          label: string
          red_trigger: number | null
          sort_order: number
          target: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          archived_at?: string | null
          board_id: string
          company_id: string
          created_at?: string
          direction?: Database["public"]["Enums"]["dm_metric_direction"]
          id?: string
          key: string
          label: string
          red_trigger?: number | null
          sort_order?: number
          target?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          archived_at?: string | null
          board_id?: string
          company_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["dm_metric_direction"]
          id?: string
          key?: string
          label?: string
          red_trigger?: number | null
          sort_order?: number
          target?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_metric_defs_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_metric_defs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_metric_defs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dm_metric_values: {
        Row: {
          board_id: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          metric_def_id: string
          note: string | null
          plan_value: number | null
          updated_at: string
          value: number | null
          value_date: string
        }
        Insert: {
          board_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          metric_def_id: string
          note?: string | null
          plan_value?: number | null
          updated_at?: string
          value?: number | null
          value_date: string
        }
        Update: {
          board_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metric_def_id?: string
          note?: string | null
          plan_value?: number | null
          updated_at?: string
          value?: number | null
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_metric_values_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "dm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_metric_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_metric_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "dm_metric_values_metric_def_id_fkey"
            columns: ["metric_def_id"]
            isOneToOne: false
            referencedRelation: "dm_metric_defs"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_reason_codes: {
        Row: {
          archived_at: string | null
          category_key: string | null
          color: string
          company_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_key?: string | null
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_key?: string | null
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      dmaic_projects: {
        Row: {
          analyze_summary: string | null
          archived_at: string | null
          company_id: string
          control_summary: string | null
          created_at: string
          created_by: string | null
          goal: string | null
          id: string
          improve_summary: string | null
          measure_summary: string | null
          metrics: string | null
          owner_id: string | null
          phase: Database["public"]["Enums"]["dmaic_phase"]
          problem_statement: string | null
          status: Database["public"]["Enums"]["dmaic_status"]
          title: string
          updated_at: string
        }
        Insert: {
          analyze_summary?: string | null
          archived_at?: string | null
          company_id?: string
          control_summary?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          id?: string
          improve_summary?: string | null
          measure_summary?: string | null
          metrics?: string | null
          owner_id?: string | null
          phase?: Database["public"]["Enums"]["dmaic_phase"]
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["dmaic_status"]
          title: string
          updated_at?: string
        }
        Update: {
          analyze_summary?: string | null
          archived_at?: string | null
          company_id?: string
          control_summary?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          id?: string
          improve_summary?: string | null
          measure_summary?: string | null
          metrics?: string | null
          owner_id?: string | null
          phase?: Database["public"]["Enums"]["dmaic_phase"]
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["dmaic_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dmaic_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dmaic_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      eight_d_reports: {
        Row: {
          archived_at: string | null
          company_id: string
          completed_disciplines: string[]
          created_at: string
          created_by: string | null
          d0_emergency_action: string | null
          d0_rationale: string | null
          d1_champion: string | null
          d1_team: string | null
          d2_how: string | null
          d2_how_many: string | null
          d2_what: string | null
          d2_when: string | null
          d2_where: string | null
          d2_who: string | null
          d2_why: string | null
          d3_containment: string | null
          d3_containment_cost: number | null
          d3_escape_verified: boolean
          d4_cause_escape: string | null
          d4_cause_occurrence: string | null
          d4_verification: string | null
          d5_actions: string | null
          d5_risk_assessment: string | null
          d5_trial_result: string | null
          d6_containment_removed_on: string | null
          d6_implementation: string | null
          d6_owner: string | null
          d6_target_date: string | null
          d6_validation_period: string | null
          d7_prevention: string | null
          d8_closed_on: string | null
          d8_recognition: string | null
          emergency_response: boolean
          id: string
          owner_id: string | null
          reference: string | null
          severity: Database["public"]["Enums"]["eight_d_severity"]
          source_escalation_id: string | null
          status: Database["public"]["Enums"]["eight_d_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          completed_disciplines?: string[]
          created_at?: string
          created_by?: string | null
          d0_emergency_action?: string | null
          d0_rationale?: string | null
          d1_champion?: string | null
          d1_team?: string | null
          d2_how?: string | null
          d2_how_many?: string | null
          d2_what?: string | null
          d2_when?: string | null
          d2_where?: string | null
          d2_who?: string | null
          d2_why?: string | null
          d3_containment?: string | null
          d3_containment_cost?: number | null
          d3_escape_verified?: boolean
          d4_cause_escape?: string | null
          d4_cause_occurrence?: string | null
          d4_verification?: string | null
          d5_actions?: string | null
          d5_risk_assessment?: string | null
          d5_trial_result?: string | null
          d6_containment_removed_on?: string | null
          d6_implementation?: string | null
          d6_owner?: string | null
          d6_target_date?: string | null
          d6_validation_period?: string | null
          d7_prevention?: string | null
          d8_closed_on?: string | null
          d8_recognition?: string | null
          emergency_response?: boolean
          id?: string
          owner_id?: string | null
          reference?: string | null
          severity?: Database["public"]["Enums"]["eight_d_severity"]
          source_escalation_id?: string | null
          status?: Database["public"]["Enums"]["eight_d_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          completed_disciplines?: string[]
          created_at?: string
          created_by?: string | null
          d0_emergency_action?: string | null
          d0_rationale?: string | null
          d1_champion?: string | null
          d1_team?: string | null
          d2_how?: string | null
          d2_how_many?: string | null
          d2_what?: string | null
          d2_when?: string | null
          d2_where?: string | null
          d2_who?: string | null
          d2_why?: string | null
          d3_containment?: string | null
          d3_containment_cost?: number | null
          d3_escape_verified?: boolean
          d4_cause_escape?: string | null
          d4_cause_occurrence?: string | null
          d4_verification?: string | null
          d5_actions?: string | null
          d5_risk_assessment?: string | null
          d5_trial_result?: string | null
          d6_containment_removed_on?: string | null
          d6_implementation?: string | null
          d6_owner?: string | null
          d6_target_date?: string | null
          d6_validation_period?: string | null
          d7_prevention?: string | null
          d8_closed_on?: string | null
          d8_recognition?: string | null
          emergency_response?: boolean
          id?: string
          owner_id?: string | null
          reference?: string | null
          severity?: Database["public"]["Enums"]["eight_d_severity"]
          source_escalation_id?: string | null
          status?: Database["public"]["Enums"]["eight_d_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eight_d_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eight_d_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "eight_d_reports_source_escalation_id_fkey"
            columns: ["source_escalation_id"]
            isOneToOne: false
            referencedRelation: "dm_escalations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          assessed_on: string | null
          assessor: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          level: number
          notes: string | null
          skill_id: string
          updated_at: string
        }
        Insert: {
          assessed_on?: string | null
          assessor?: string | null
          company_id?: string
          created_at?: string
          employee_id: string
          id?: string
          level?: number
          notes?: string | null
          skill_id: string
          updated_at?: string
        }
        Update: {
          assessed_on?: string | null
          assessor?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          level?: number
          notes?: string | null
          skill_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          department: string | null
          email: string | null
          employee_no: string | null
          first_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          last_name: string
          manager_id: string | null
          notes: string | null
          role_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_no?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name: string
          manager_id?: string | null
          notes?: string | null
          role_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_no?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          manager_id?: string | null
          notes?: string | null
          role_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      en_links: {
        Row: {
          company_id: string
          created_at: string
          from_node: string
          id: string
          lag_weeks: number
          link_type: string
          model_id: string
          note: string | null
          polarity: string
          strength: number
          to_node: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          from_node: string
          id?: string
          lag_weeks?: number
          link_type?: string
          model_id: string
          note?: string | null
          polarity?: string
          strength?: number
          to_node: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          from_node?: string
          id?: string
          lag_weeks?: number
          link_type?: string
          model_id?: string
          note?: string | null
          polarity?: string
          strength?: number
          to_node?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "en_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "en_links_from_node_fkey"
            columns: ["from_node"]
            isOneToOne: false
            referencedRelation: "en_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_links_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "en_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_links_to_node_fkey"
            columns: ["to_node"]
            isOneToOne: false
            referencedRelation: "en_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      en_models: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "en_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      en_nodes: {
        Row: {
          company_id: string
          created_at: string
          criticality: number
          health: string | null
          id: string
          label: string
          layer: string
          model_id: string
          node_type: string
          notes: string | null
          owner_id: string | null
          owner_label: string | null
          pillar: string | null
          pinned: boolean
          sort_order: number
          source_id: string | null
          source_table: string | null
          updated_at: string
          x: number | null
          y: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          criticality?: number
          health?: string | null
          id?: string
          label: string
          layer?: string
          model_id: string
          node_type?: string
          notes?: string | null
          owner_id?: string | null
          owner_label?: string | null
          pillar?: string | null
          pinned?: boolean
          sort_order?: number
          source_id?: string | null
          source_table?: string | null
          updated_at?: string
          x?: number | null
          y?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          criticality?: number
          health?: string | null
          id?: string
          label?: string
          layer?: string
          model_id?: string
          node_type?: string
          notes?: string | null
          owner_id?: string | null
          owner_label?: string | null
          pillar?: string | null
          pinned?: boolean
          sort_order?: number
          source_id?: string | null
          source_table?: string | null
          updated_at?: string
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "en_nodes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_nodes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "en_nodes_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "en_models"
            referencedColumns: ["id"]
          },
        ]
      }
      en_scenarios: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          direction: string
          id: string
          model_id: string
          name: string
          results: Json | null
          settings: Json
          shock_pct: number
          source_node: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          model_id: string
          name: string
          results?: Json | null
          settings?: Json
          shock_pct?: number
          source_node?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          model_id?: string
          name?: string
          results?: Json | null
          settings?: Json
          shock_pct?: number
          source_node?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "en_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "en_scenarios_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "en_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "en_scenarios_source_node_fkey"
            columns: ["source_node"]
            isOneToOne: false
            referencedRelation: "en_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      eol_asset_disposition: {
        Row: {
          asset_name: string
          asset_tag: string | null
          book_value: number | null
          company_id: string
          created_at: string
          disposition: string
          id: string
          location: string | null
          notes: string | null
          program_id: string
          realized_value: number | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_name: string
          asset_tag?: string | null
          book_value?: number | null
          company_id?: string
          created_at?: string
          disposition?: string
          id?: string
          location?: string | null
          notes?: string | null
          program_id: string
          realized_value?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_name?: string
          asset_tag?: string | null
          book_value?: number | null
          company_id?: string
          created_at?: string
          disposition?: string
          id?: string
          location?: string | null
          notes?: string | null
          program_id?: string
          realized_value?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eol_asset_disposition_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "eol_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      eol_customer_migration: {
        Row: {
          company_id: string
          created_at: string
          current_product: string | null
          customer: string
          id: string
          notes: string | null
          notice_date: string | null
          program_id: string
          revenue_at_risk: number | null
          status: string
          target_product: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          current_product?: string | null
          customer: string
          id?: string
          notes?: string | null
          notice_date?: string | null
          program_id: string
          revenue_at_risk?: number | null
          status?: string
          target_product?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_product?: string | null
          customer?: string
          id?: string
          notes?: string | null
          notice_date?: string | null
          program_id?: string
          revenue_at_risk?: number | null
          status?: string
          target_product?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eol_customer_migration_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "eol_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      eol_gate_checklist: {
        Row: {
          company_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          evidence_url: string | null
          id: string
          label: string
          notes: string | null
          phase: number
          program_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          label: string
          notes?: string | null
          phase: number
          program_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          label?: string
          notes?: string | null
          phase?: number
          program_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eol_gate_checklist_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "eol_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      eol_ltb_items: {
        Row: {
          company_id: string
          consumed_qty: number | null
          created_at: string
          description: string | null
          forecast_qty: number | null
          holding_strategy: string
          id: string
          notes: string | null
          ordered_qty: number | null
          part_number: string
          program_id: string
          risk_tier: string
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          consumed_qty?: number | null
          created_at?: string
          description?: string | null
          forecast_qty?: number | null
          holding_strategy?: string
          id?: string
          notes?: string | null
          ordered_qty?: number | null
          part_number: string
          program_id: string
          risk_tier?: string
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          consumed_qty?: number | null
          created_at?: string
          description?: string | null
          forecast_qty?: number | null
          holding_strategy?: string
          id?: string
          notes?: string | null
          ordered_qty?: number | null
          part_number?: string
          program_id?: string
          risk_tier?: string
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eol_ltb_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "eol_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      eol_programs: {
        Row: {
          aftermarket_owner_id: string | null
          archived_at: string | null
          closeout_date: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          engineering_owner_id: string | null
          eos_announce_date: string | null
          family: string | null
          finance_owner_id: string | null
          fts_date: string | null
          health: string | null
          id: string
          lifetime_revenue: number | null
          line_clear_date: string | null
          ltb_cutoff_date: string | null
          notes: string | null
          phase: number
          platform: string | null
          product_name: string
          program_owner_id: string | null
          reserve_budget: number | null
          status: string
          supply_chain_owner_id: string | null
          updated_at: string
        }
        Insert: {
          aftermarket_owner_id?: string | null
          archived_at?: string | null
          closeout_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          engineering_owner_id?: string | null
          eos_announce_date?: string | null
          family?: string | null
          finance_owner_id?: string | null
          fts_date?: string | null
          health?: string | null
          id?: string
          lifetime_revenue?: number | null
          line_clear_date?: string | null
          ltb_cutoff_date?: string | null
          notes?: string | null
          phase?: number
          platform?: string | null
          product_name: string
          program_owner_id?: string | null
          reserve_budget?: number | null
          status?: string
          supply_chain_owner_id?: string | null
          updated_at?: string
        }
        Update: {
          aftermarket_owner_id?: string | null
          archived_at?: string | null
          closeout_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          engineering_owner_id?: string | null
          eos_announce_date?: string | null
          family?: string | null
          finance_owner_id?: string | null
          fts_date?: string | null
          health?: string | null
          id?: string
          lifetime_revenue?: number | null
          line_clear_date?: string | null
          ltb_cutoff_date?: string | null
          notes?: string | null
          phase?: number
          platform?: string | null
          product_name?: string
          program_owner_id?: string | null
          reserve_budget?: number | null
          status?: string
          supply_chain_owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eol_readiness: {
        Row: {
          company_id: string
          complete: boolean
          created_at: string
          deliverable: string
          domain: string
          id: string
          notes: string | null
          owner_id: string | null
          program_id: string
          rag: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id?: string
          complete?: boolean
          created_at?: string
          deliverable: string
          domain: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          program_id: string
          rag?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          complete?: boolean
          created_at?: string
          deliverable?: string
          domain?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          program_id?: string
          rag?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eol_readiness_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "eol_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_gate_checklist: {
        Row: {
          company_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          evidence_url: string | null
          id: string
          label: string
          notes: string | null
          project_id: string
          sort_order: number
          stage: number
          updated_at: string
        }
        Insert: {
          company_id: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          label: string
          notes?: string | null
          project_id: string
          sort_order?: number
          stage: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          label?: string
          notes?: string | null
          project_id?: string
          sort_order?: number
          stage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_gate_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "equipment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_payment_milestones: {
        Row: {
          amount: number | null
          company_id: string
          created_at: string
          gate: number | null
          id: string
          label: string
          percent: number
          project_id: string
          released_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          company_id: string
          created_at?: string
          gate?: number | null
          id?: string
          label: string
          percent?: number
          project_id: string
          released_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          company_id?: string
          created_at?: string
          gate?: number | null
          id?: string
          label?: string
          percent?: number
          project_id?: string
          released_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_payment_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "equipment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_projects: {
        Row: {
          archived_at: string | null
          asset_name: string
          asset_tag: string | null
          company_id: string
          contract_value: number | null
          cpk_target: number
          created_at: string
          created_by: string | null
          currency: string
          delivery_date: string | null
          description: string | null
          fat_date: string | null
          handover_date: string | null
          health: string | null
          id: string
          line_area: string | null
          maintenance_owner_id: string | null
          notes: string | null
          oee_target: number
          owner_id: string | null
          po_date: string | null
          po_number: string | null
          pq_date: string | null
          sat_date: string | null
          sponsor_id: string | null
          stage: number
          status: string
          sustain_shifts: number
          target_handover_date: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          archived_at?: string | null
          asset_name: string
          asset_tag?: string | null
          company_id: string
          contract_value?: number | null
          cpk_target?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_date?: string | null
          description?: string | null
          fat_date?: string | null
          handover_date?: string | null
          health?: string | null
          id?: string
          line_area?: string | null
          maintenance_owner_id?: string | null
          notes?: string | null
          oee_target?: number
          owner_id?: string | null
          po_date?: string | null
          po_number?: string | null
          pq_date?: string | null
          sat_date?: string | null
          sponsor_id?: string | null
          stage?: number
          status?: string
          sustain_shifts?: number
          target_handover_date?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          archived_at?: string | null
          asset_name?: string
          asset_tag?: string | null
          company_id?: string
          contract_value?: number | null
          cpk_target?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          delivery_date?: string | null
          description?: string | null
          fat_date?: string | null
          handover_date?: string | null
          health?: string | null
          id?: string
          line_area?: string | null
          maintenance_owner_id?: string | null
          notes?: string | null
          oee_target?: number
          owner_id?: string | null
          po_date?: string | null
          po_number?: string | null
          pq_date?: string | null
          sat_date?: string | null
          sponsor_id?: string | null
          stage?: number
          status?: string
          sustain_shifts?: number
          target_handover_date?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      equipment_punch_items: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          owner_id: string | null
          project_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          project_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          project_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_punch_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "equipment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_ramp_log: {
        Row: {
          actual_pct: number | null
          availability: number | null
          company_id: string
          created_at: string
          entry_date: string
          id: string
          mtbf_hours: number | null
          mttr_hours: number | null
          note: string | null
          performance: number | null
          planned_pct: number | null
          project_id: string
          quality: number | null
          updated_at: string
        }
        Insert: {
          actual_pct?: number | null
          availability?: number | null
          company_id: string
          created_at?: string
          entry_date?: string
          id?: string
          mtbf_hours?: number | null
          mttr_hours?: number | null
          note?: string | null
          performance?: number | null
          planned_pct?: number | null
          project_id: string
          quality?: number | null
          updated_at?: string
        }
        Update: {
          actual_pct?: number | null
          availability?: number | null
          company_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          mtbf_hours?: number | null
          mttr_hours?: number | null
          note?: string | null
          performance?: number | null
          planned_pct?: number | null
          project_id?: string
          quality?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_ramp_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "equipment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      exec_room_messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          persona: string | null
          role: string
          thread_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          persona?: string | null
          role: string
          thread_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          persona?: string | null
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exec_room_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exec_room_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "exec_room_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "exec_room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      exec_room_threads: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exec_room_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exec_room_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      fishbone_reports: {
        Row: {
          archived_at: string | null
          categories: Json
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          owner_id: string | null
          problem_statement: string | null
          status: Database["public"]["Enums"]["fishbone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          categories?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["fishbone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          categories?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["fishbone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishbone_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishbone_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      five_whys_reports: {
        Row: {
          archived_at: string | null
          company_id: string
          corrective_action: string | null
          created_at: string
          created_by: string | null
          id: string
          owner_id: string | null
          problem_statement: string | null
          root_cause: string | null
          status: Database["public"]["Enums"]["five_whys_status"]
          title: string
          updated_at: string
          why_1: string | null
          why_2: string | null
          why_3: string | null
          why_4: string | null
          why_5: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          problem_statement?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["five_whys_status"]
          title: string
          updated_at?: string
          why_1?: string | null
          why_2?: string | null
          why_3?: string | null
          why_4?: string | null
          why_5?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          corrective_action?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          problem_statement?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["five_whys_status"]
          title?: string
          updated_at?: string
          why_1?: string | null
          why_2?: string | null
          why_3?: string | null
          why_4?: string | null
          why_5?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "five_whys_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "five_whys_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      growth_targets: {
        Row: {
          amount: number
          company_id: string
          id: string
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          company_id?: string
          id?: string
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          company_id?: string
          id?: string
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "growth_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      hoshin_correlations: {
        Row: {
          company_id: string
          created_at: string
          from_id: string
          id: string
          strength: Database["public"]["Enums"]["hoshin_correlation"]
          to_id: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          from_id: string
          id?: string
          strength?: Database["public"]["Enums"]["hoshin_correlation"]
          to_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          from_id?: string
          id?: string
          strength?: Database["public"]["Enums"]["hoshin_correlation"]
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoshin_correlations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoshin_correlations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "hoshin_correlations_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "hoshin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoshin_correlations_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "hoshin_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hoshin_items: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          current_value: string | null
          description: string | null
          horizon: string | null
          id: string
          kind: Database["public"]["Enums"]["hoshin_kind"]
          owner_id: string | null
          sort_order: number
          target_value: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          current_value?: string | null
          description?: string | null
          horizon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["hoshin_kind"]
          owner_id?: string | null
          sort_order?: number
          target_value?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          current_value?: string | null
          description?: string | null
          horizon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["hoshin_kind"]
          owner_id?: string | null
          sort_order?: number
          target_value?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoshin_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoshin_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "hoshin_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hoshin_reviews: {
        Row: {
          archived_at: string | null
          catchball: Json
          company_id: string
          created_at: string
          created_by: string | null
          findings: Json
          id: string
          notes: string | null
          owner_id: string | null
          plan_id: string | null
          review_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          catchball?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          findings?: Json
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          review_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          catchball?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          findings?: Json
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          review_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hoshin_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoshin_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "hoshin_reviews_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ibp_cycles: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          cycle_month: string | null
          horizon_months: number
          id: string
          notes: string | null
          owner_id: string | null
          plan_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          cycle_month?: string | null
          horizon_months?: number
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          cycle_month?: string | null
          horizon_months?: number
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ibp_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ibp_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ibp_cycles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ibp_gaps: {
        Row: {
          company_id: string
          created_at: string
          cycle_id: string
          demand_val: number | null
          financial_val: number | null
          id: string
          kind: string
          label: string
          lead_time_weeks: number | null
          month: string | null
          notes: string | null
          owner_id: string | null
          risk: string | null
          sort_order: number
          status: Database["public"]["Enums"]["problem_step_status"]
          supply_val: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          cycle_id: string
          demand_val?: number | null
          financial_val?: number | null
          id?: string
          kind?: string
          label: string
          lead_time_weeks?: number | null
          month?: string | null
          notes?: string | null
          owner_id?: string | null
          risk?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          supply_val?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          cycle_id?: string
          demand_val?: number | null
          financial_val?: number | null
          id?: string
          kind?: string
          label?: string
          lead_time_weeks?: number | null
          month?: string | null
          notes?: string | null
          owner_id?: string | null
          risk?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          supply_val?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ibp_gaps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ibp_gaps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ibp_gaps_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "ibp_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      ibp_steps: {
        Row: {
          assumptions: string | null
          company_id: string
          created_at: string
          cycle_id: string
          decisions: string | null
          id: string
          meeting_date: string | null
          owner_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["problem_step_status"]
          step_key: string
          updated_at: string
        }
        Insert: {
          assumptions?: string | null
          company_id: string
          created_at?: string
          cycle_id: string
          decisions?: string | null
          id?: string
          meeting_date?: string | null
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          step_key: string
          updated_at?: string
        }
        Update: {
          assumptions?: string | null
          company_id?: string
          created_at?: string
          cycle_id?: string
          decisions?: string | null
          id?: string
          meeting_date?: string | null
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          step_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ibp_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ibp_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ibp_steps_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "ibp_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      industrial_strategy_entries: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          id: string
          item_key: string
          position: number
          section_key: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          item_key: string
          position?: number
          section_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          item_key?: string
          position?: number
          section_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      industrial_strategy_rows: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          id: string
          label: string | null
          position: number
          section_key: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          label?: string | null
          position?: number
          section_key: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          label?: string | null
          position?: number
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      initiatives: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          current_stage: Database["public"]["Enums"]["initiative_stage"]
          description: string | null
          end_date: string | null
          gross_value_l1: number
          id: string
          locked: boolean
          milestones: Json
          owner_id: string | null
          progress: number
          source_objective_id: string | null
          source_waterfall_item_id: string | null
          start_date: string | null
          title: string
          updated_at: string
          validated_value_l2: number
          workstream_id: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          current_stage?: Database["public"]["Enums"]["initiative_stage"]
          description?: string | null
          end_date?: string | null
          gross_value_l1?: number
          id?: string
          locked?: boolean
          milestones?: Json
          owner_id?: string | null
          progress?: number
          source_objective_id?: string | null
          source_waterfall_item_id?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          validated_value_l2?: number
          workstream_id: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          current_stage?: Database["public"]["Enums"]["initiative_stage"]
          description?: string | null
          end_date?: string | null
          gross_value_l1?: number
          id?: string
          locked?: boolean
          milestones?: Json
          owner_id?: string | null
          progress?: number
          source_objective_id?: string | null
          source_waterfall_item_id?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          validated_value_l2?: number
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "initiatives_source_objective_id_fkey"
            columns: ["source_objective_id"]
            isOneToOne: true
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_source_waterfall_item_id_fkey"
            columns: ["source_waterfall_item_id"]
            isOneToOne: true
            referencedRelation: "waterfall_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          account_id: string
          author_id: string | null
          body: string | null
          body_text: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          id: string
          occurred_at: string
          search_vector: unknown
          subject: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          author_id?: string | null
          body?: string | null
          body_text?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          search_vector?: unknown
          subject?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          author_id?: string | null
          body?: string | null
          body_text?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          search_vector?: unknown
          subject?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          company_id: string
          created_at: string
          department: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      journey_maps: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          owner_id: string | null
          plan_id: string | null
          segment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          segment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string | null
          segment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_maps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_maps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "journey_maps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_pain_points: {
        Row: {
          company_id: string
          countermeasure: string | null
          created_at: string
          frequency: number
          id: string
          label: string
          map_id: string
          owner_id: string | null
          root_cause: string | null
          severity: number
          sort_order: number
          stage_key: string
          status: Database["public"]["Enums"]["problem_step_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          countermeasure?: string | null
          created_at?: string
          frequency?: number
          id?: string
          label: string
          map_id: string
          owner_id?: string | null
          root_cause?: string | null
          severity?: number
          sort_order?: number
          stage_key: string
          status?: Database["public"]["Enums"]["problem_step_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          countermeasure?: string | null
          created_at?: string
          frequency?: number
          id?: string
          label?: string
          map_id?: string
          owner_id?: string | null
          root_cause?: string | null
          severity?: number
          sort_order?: number
          stage_key?: string
          status?: Database["public"]["Enums"]["problem_step_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_pain_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_pain_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "journey_pain_points_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "journey_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_stages: {
        Row: {
          company_id: string
          created_at: string
          id: string
          map_id: string
          moments: string | null
          sentiment: number
          stage_key: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          map_id: string
          moments?: string | null
          sentiment?: number
          stage_key: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          map_id?: string
          moments?: string | null
          sentiment?: number
          stage_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "journey_stages_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "journey_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_values: {
        Row: {
          actual: number | null
          company_id: string
          created_at: string
          id: string
          kpi_id: string
          note: string | null
          period_start: string
          target: number | null
        }
        Insert: {
          actual?: number | null
          company_id?: string
          created_at?: string
          id?: string
          kpi_id: string
          note?: string | null
          period_start: string
          target?: number | null
        }
        Update: {
          actual?: number | null
          company_id?: string
          created_at?: string
          id?: string
          kpi_id?: string
          note?: string | null
          period_start?: string
          target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          amber_threshold: number | null
          archived_at: string | null
          category: string | null
          code: string | null
          company_id: string
          created_at: string
          data_source: string | null
          description: string | null
          exclusions: string | null
          formula: string | null
          frequency: string
          green_threshold: number | null
          hierarchy_level: number | null
          higher_is_better: boolean
          id: string
          indicator_type: string | null
          is_key: boolean
          library_key: string | null
          name: string
          owner_id: string | null
          pillar_id: string
          purpose: string | null
          reporting_level: string | null
          scope: string | null
          target: number | null
          unit: string | null
        }
        Insert: {
          amber_threshold?: number | null
          archived_at?: string | null
          category?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          data_source?: string | null
          description?: string | null
          exclusions?: string | null
          formula?: string | null
          frequency?: string
          green_threshold?: number | null
          hierarchy_level?: number | null
          higher_is_better?: boolean
          id?: string
          indicator_type?: string | null
          is_key?: boolean
          library_key?: string | null
          name: string
          owner_id?: string | null
          pillar_id: string
          purpose?: string | null
          reporting_level?: string | null
          scope?: string | null
          target?: number | null
          unit?: string | null
        }
        Update: {
          amber_threshold?: number | null
          archived_at?: string | null
          category?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          data_source?: string | null
          description?: string | null
          exclusions?: string | null
          formula?: string | null
          frequency?: string
          green_threshold?: number | null
          hierarchy_level?: number | null
          higher_is_better?: boolean
          id?: string
          indicator_type?: string | null
          is_key?: boolean
          library_key?: string | null
          name?: string
          owner_id?: string | null
          pillar_id?: string
          purpose?: string | null
          reporting_level?: string | null
          scope?: string | null
          target?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "kpis_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_events: {
        Row: {
          attribution: Json | null
          created_at: string
          event: string
          id: string
          variant: string | null
        }
        Insert: {
          attribution?: Json | null
          created_at?: string
          event: string
          id?: string
          variant?: string | null
        }
        Update: {
          attribution?: Json | null
          created_at?: string
          event?: string
          id?: string
          variant?: string | null
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          attendees: string[]
          company_id: string
          created_at: string
          created_by: string | null
          health_snapshot: Json
          id: string
          section_notes: Json
          updated_at: string
          week_start: string
        }
        Insert: {
          attendees?: string[]
          company_id?: string
          created_at?: string
          created_by?: string | null
          health_snapshot?: Json
          id?: string
          section_notes?: Json
          updated_at?: string
          week_start: string
        }
        Update: {
          attendees?: string[]
          company_id?: string
          created_at?: string
          created_by?: string | null
          health_snapshot?: Json
          id?: string
          section_notes?: Json
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mro_actions: {
        Row: {
          assessment_id: string
          company_id: string
          created_at: string
          driver_key: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["problem_step_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          company_id: string
          created_at?: string
          driver_key?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          company_id?: string
          created_at?: string
          driver_key?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mro_actions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "mro_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mro_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mro_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mro_assessments: {
        Row: {
          aircraft_type: string | null
          archived_at: string | null
          check_type: string | null
          company_id: string
          created_at: string
          drivers: Json
          id: string
          modules: Json
          owner_id: string | null
          plan_id: string | null
          title: string
          updated_at: string
          wrench_time_pct: number
        }
        Insert: {
          aircraft_type?: string | null
          archived_at?: string | null
          check_type?: string | null
          company_id: string
          created_at?: string
          drivers?: Json
          id?: string
          modules?: Json
          owner_id?: string | null
          plan_id?: string | null
          title: string
          updated_at?: string
          wrench_time_pct?: number
        }
        Update: {
          aircraft_type?: string | null
          archived_at?: string | null
          check_type?: string | null
          company_id?: string
          created_at?: string
          drivers?: Json
          id?: string
          modules?: Json
          owner_id?: string | null
          plan_id?: string | null
          title?: string
          updated_at?: string
          wrench_time_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "mro_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mro_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mro_assessments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      npi_gate_checklist: {
        Row: {
          company_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          evidence_url: string | null
          gate: number
          id: string
          label: string
          notes: string | null
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          gate: number
          id?: string
          label: string
          notes?: string | null
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_url?: string | null
          gate?: number
          id?: string
          label?: string
          notes?: string | null
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "npi_gate_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_gate_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "npi_gate_checklist_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_gate_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "npi_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      npi_projects: {
        Row: {
          archived_at: string | null
          bid_unit_cost: number | null
          bid_unit_hours: number | null
          company_id: string
          contract_award_date: string | null
          created_at: string
          created_by: string | null
          current_gate: number
          customer: string | null
          description: string | null
          eis_date: string | null
          fai_date: string | null
          health: string | null
          id: string
          material_class: string | null
          notes: string | null
          owner_id: string | null
          part_name: string | null
          part_number: string
          pdr_cdr_date: string | null
          platform: string | null
          program: string | null
          program_manager_id: string | null
          prr_date: string | null
          sponsor_id: string | null
          status: string
          target_eis_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          bid_unit_cost?: number | null
          bid_unit_hours?: number | null
          company_id?: string
          contract_award_date?: string | null
          created_at?: string
          created_by?: string | null
          current_gate?: number
          customer?: string | null
          description?: string | null
          eis_date?: string | null
          fai_date?: string | null
          health?: string | null
          id?: string
          material_class?: string | null
          notes?: string | null
          owner_id?: string | null
          part_name?: string | null
          part_number: string
          pdr_cdr_date?: string | null
          platform?: string | null
          program?: string | null
          program_manager_id?: string | null
          prr_date?: string | null
          sponsor_id?: string | null
          status?: string
          target_eis_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          bid_unit_cost?: number | null
          bid_unit_hours?: number | null
          company_id?: string
          contract_award_date?: string | null
          created_at?: string
          created_by?: string | null
          current_gate?: number
          customer?: string | null
          description?: string | null
          eis_date?: string | null
          fai_date?: string | null
          health?: string | null
          id?: string
          material_class?: string | null
          notes?: string | null
          owner_id?: string | null
          part_name?: string | null
          part_number?: string
          pdr_cdr_date?: string | null
          platform?: string | null
          program?: string | null
          program_manager_id?: string | null
          prr_date?: string | null
          sponsor_id?: string | null
          status?: string
          target_eis_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "npi_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "npi_projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_projects_program_manager_id_fkey"
            columns: ["program_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_projects_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      npi_risks: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          impact: number | null
          likelihood: number | null
          mitigation: string | null
          owner_id: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation?: string | null
          owner_id?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          impact?: number | null
          likelihood?: number | null
          mitigation?: string | null
          owner_id?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "npi_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "npi_risks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npi_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "npi_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_actions: {
        Row: {
          archived_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          objective_id: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["objective_action_status"]
          title: string
          updated_at: string
          waterfall_item_id: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          objective_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["objective_action_status"]
          title: string
          updated_at?: string
          waterfall_item_id?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          objective_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["objective_action_status"]
          title?: string
          updated_at?: string
          waterfall_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objective_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "objective_actions_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_actions_waterfall_item_id_fkey"
            columns: ["waterfall_item_id"]
            isOneToOne: false
            referencedRelation: "waterfall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_kpi_values: {
        Row: {
          actual: number | null
          company_id: string
          created_at: string
          id: string
          kpi_id: string
          note: string | null
          period_start: string
          updated_at: string
        }
        Insert: {
          actual?: number | null
          company_id?: string
          created_at?: string
          id?: string
          kpi_id: string
          note?: string | null
          period_start: string
          updated_at?: string
        }
        Update: {
          actual?: number | null
          company_id?: string
          created_at?: string
          id?: string
          kpi_id?: string
          note?: string | null
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objective_kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "objective_kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "objective_kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_kpis: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          frequency: string
          higher_is_better: boolean
          id: string
          kind: Database["public"]["Enums"]["objective_kpi_kind"]
          name: string
          objective_id: string
          owner_id: string | null
          target: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          frequency?: string
          higher_is_better?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["objective_kpi_kind"]
          name: string
          objective_id: string
          owner_id?: string | null
          target?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          frequency?: string
          higher_is_better?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["objective_kpi_kind"]
          name?: string
          objective_id?: string
          owner_id?: string | null
          target?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objective_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "objective_kpis_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_monthly_benefits: {
        Row: {
          actual: number
          company_id: string
          created_at: string
          id: string
          month: number
          objective_id: string
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          actual?: number
          company_id?: string
          created_at?: string
          id?: string
          month: number
          objective_id: string
          updated_at?: string
          value?: number
          year: number
        }
        Update: {
          actual?: number
          company_id?: string
          created_at?: string
          id?: string
          month?: number
          objective_id?: string
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "objective_monthly_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_monthly_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "objective_monthly_benefits_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      oms_standard_work: {
        Row: {
          blocks: Json
          company_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          company_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          blocks?: Json
          company_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_standard_work_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oms_standard_work_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      oms_standard_work_templates: {
        Row: {
          blocks: Json
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          blocks?: Json
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oms_standard_work_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oms_standard_work_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          account_id: string
          archived: boolean
          company_id: string
          contact_id: string | null
          created_at: string
          currency: string
          expected_close_date: string | null
          gross_margin_pct: number | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          probability: number
          source: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          updated_at: string
          value: number
        }
        Insert: {
          account_id: string
          archived?: boolean
          company_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          gross_margin_pct?: number | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          value?: number
        }
        Update: {
          account_id?: string
          archived?: boolean
          company_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          gross_margin_pct?: number | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_monthly_values: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          month: number
          opportunity_id: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          month: number
          opportunity_id: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          month?: number
          opportunity_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_monthly_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_monthly_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "opportunity_monthly_values_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          address: string | null
          as9100_cert_no: string | null
          company_id: string
          company_name: string | null
          created_at: string
          easa_approval_no: string | null
          faa_certificate_no: string | null
          id: string
          logo_url: string | null
          quality_manager_name: string | null
          retention_days: number | null
          security_contact_email: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          as9100_cert_no?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string
          easa_approval_no?: string | null
          faa_certificate_no?: string | null
          id?: string
          logo_url?: string | null
          quality_manager_name?: string | null
          retention_days?: number | null
          security_contact_email?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          as9100_cert_no?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string
          easa_approval_no?: string | null
          faa_certificate_no?: string | null
          id?: string
          logo_url?: string | null
          quality_manager_name?: string | null
          retention_days?: number | null
          security_contact_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      owner_dashboard_templates: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_financials: {
        Row: {
          ap_total: number | null
          ar_over_60: number | null
          ar_total: number | null
          cash: number | null
          cogs: number | null
          company_id: string
          created_at: string
          debt: number | null
          ebitda: number | null
          ebitda_budget: number | null
          ebitda_py: number | null
          extras: Json
          free_cash_flow: number | null
          headcount: number | null
          id: string
          inventory: number | null
          labor_cost: number | null
          month: string
          notes: string | null
          operating_cash_flow: number | null
          opex: number | null
          overtime_pct: number | null
          revenue: number | null
          revenue_budget: number | null
          revenue_py: number | null
          safety_incidents: number | null
          turnover_pct: number | null
          updated_at: string
          valuation_multiple: number | null
        }
        Insert: {
          ap_total?: number | null
          ar_over_60?: number | null
          ar_total?: number | null
          cash?: number | null
          cogs?: number | null
          company_id?: string
          created_at?: string
          debt?: number | null
          ebitda?: number | null
          ebitda_budget?: number | null
          ebitda_py?: number | null
          extras?: Json
          free_cash_flow?: number | null
          headcount?: number | null
          id?: string
          inventory?: number | null
          labor_cost?: number | null
          month: string
          notes?: string | null
          operating_cash_flow?: number | null
          opex?: number | null
          overtime_pct?: number | null
          revenue?: number | null
          revenue_budget?: number | null
          revenue_py?: number | null
          safety_incidents?: number | null
          turnover_pct?: number | null
          updated_at?: string
          valuation_multiple?: number | null
        }
        Update: {
          ap_total?: number | null
          ar_over_60?: number | null
          ar_total?: number | null
          cash?: number | null
          cogs?: number | null
          company_id?: string
          created_at?: string
          debt?: number | null
          ebitda?: number | null
          ebitda_budget?: number | null
          ebitda_py?: number | null
          extras?: Json
          free_cash_flow?: number | null
          headcount?: number | null
          id?: string
          inventory?: number | null
          labor_cost?: number | null
          month?: string
          notes?: string | null
          operating_cash_flow?: number | null
          opex?: number | null
          overtime_pct?: number | null
          revenue?: number | null
          revenue_budget?: number | null
          revenue_py?: number | null
          safety_incidents?: number | null
          turnover_pct?: number | null
          updated_at?: string
          valuation_multiple?: number | null
        }
        Relationships: []
      }
      part_margins: {
        Row: {
          annual_qty: number
          archived_at: string | null
          capex_project_id: string | null
          company_id: string
          created_at: string
          currency: string
          customer: string | null
          description: string | null
          id: string
          labor_cost: number
          material_cost: number
          notes: string | null
          nre_recovery: number
          overhead: number
          part_number: string
          price: number
          scrap_pct: number
          updated_at: string
        }
        Insert: {
          annual_qty?: number
          archived_at?: string | null
          capex_project_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          customer?: string | null
          description?: string | null
          id?: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          nre_recovery?: number
          overhead?: number
          part_number: string
          price?: number
          scrap_pct?: number
          updated_at?: string
        }
        Update: {
          annual_qty?: number
          archived_at?: string | null
          capex_project_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          customer?: string | null
          description?: string | null
          id?: string
          labor_cost?: number
          material_cost?: number
          notes?: string | null
          nre_recovery?: number
          overhead?: number
          part_number?: string
          price?: number
          scrap_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_margins_capex_project_id_fkey"
            columns: ["capex_project_id"]
            isOneToOne: false
            referencedRelation: "capex_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_margins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_margins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pfmea_rows: {
        Row: {
          action: string | null
          action_owner_id: string | null
          action_status: string
          cause: string | null
          classification: string | null
          company_id: string
          created_at: string
          detection: number | null
          detection_control: string | null
          due_date: string | null
          effect: string | null
          failure_mode: string | null
          function_req: string | null
          id: string
          occurrence: number | null
          post_detection: number | null
          post_occurrence: number | null
          post_severity: number | null
          prevention_control: string | null
          severity: number | null
          sort_order: number
          step_name: string
          step_no: string | null
          study_id: string
          updated_at: string
        }
        Insert: {
          action?: string | null
          action_owner_id?: string | null
          action_status?: string
          cause?: string | null
          classification?: string | null
          company_id?: string
          created_at?: string
          detection?: number | null
          detection_control?: string | null
          due_date?: string | null
          effect?: string | null
          failure_mode?: string | null
          function_req?: string | null
          id?: string
          occurrence?: number | null
          post_detection?: number | null
          post_occurrence?: number | null
          post_severity?: number | null
          prevention_control?: string | null
          severity?: number | null
          sort_order?: number
          step_name: string
          step_no?: string | null
          study_id: string
          updated_at?: string
        }
        Update: {
          action?: string | null
          action_owner_id?: string | null
          action_status?: string
          cause?: string | null
          classification?: string | null
          company_id?: string
          created_at?: string
          detection?: number | null
          detection_control?: string | null
          due_date?: string | null
          effect?: string | null
          failure_mode?: string | null
          function_req?: string | null
          id?: string
          occurrence?: number | null
          post_detection?: number | null
          post_occurrence?: number | null
          post_severity?: number | null
          prevention_control?: string | null
          severity?: number | null
          sort_order?: number
          step_name?: string
          step_no?: string | null
          study_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pfmea_rows_action_owner_id_fkey"
            columns: ["action_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pfmea_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pfmea_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pfmea_rows_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "pfmea_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      pfmea_studies: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer: string | null
          drawing_path: string | null
          id: string
          notes: string | null
          npi_project_id: string | null
          owner_id: string | null
          part_name: string | null
          part_number: string
          process_family: string
          program: string | null
          revision: string | null
          source: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer?: string | null
          drawing_path?: string | null
          id?: string
          notes?: string | null
          npi_project_id?: string | null
          owner_id?: string | null
          part_name?: string | null
          part_number: string
          process_family?: string
          program?: string | null
          revision?: string | null
          source?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer?: string | null
          drawing_path?: string | null
          id?: string
          notes?: string | null
          npi_project_id?: string | null
          owner_id?: string | null
          part_name?: string | null
          part_number?: string
          process_family?: string
          program?: string | null
          revision?: string | null
          source?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pfmea_studies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pfmea_studies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pfmea_studies_npi_project_id_fkey"
            columns: ["npi_project_id"]
            isOneToOne: false
            referencedRelation: "npi_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pfmea_studies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pillar_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["pillar_note_kind"]
          pillar_id: string
          position: number
          updated_at: string
        }
        Insert: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["pillar_note_kind"]
          pillar_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["pillar_note_kind"]
          pillar_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pillar_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pillar_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pillar_notes_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      pillars: {
        Row: {
          archived_at: string | null
          company_id: string
          health: Database["public"]["Enums"]["pillar_health"]
          id: string
          key: string
          name: string
          owner_id: string | null
          sort_order: number
          tagline: string | null
          variant: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          health?: Database["public"]["Enums"]["pillar_health"]
          id?: string
          key: string
          name: string
          owner_id?: string | null
          sort_order?: number
          tagline?: string | null
          variant?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          health?: Database["public"]["Enums"]["pillar_health"]
          id?: string
          key?: string
          name?: string
          owner_id?: string | null
          sort_order?: number
          tagline?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "pillars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pillars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pillars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playbook_items: {
        Row: {
          accepted: boolean
          company_id: string
          created_at: string
          due_date: string | null
          effort: string | null
          horizon: string | null
          id: string
          impact: string | null
          kind: string
          owner_id: string | null
          pushed_action_id: string | null
          rationale: string | null
          rule_key: string | null
          sort_order: number
          text: string
          updated_at: string
          worksheet_id: string
        }
        Insert: {
          accepted?: boolean
          company_id: string
          created_at?: string
          due_date?: string | null
          effort?: string | null
          horizon?: string | null
          id?: string
          impact?: string | null
          kind: string
          owner_id?: string | null
          pushed_action_id?: string | null
          rationale?: string | null
          rule_key?: string | null
          sort_order?: number
          text: string
          updated_at?: string
          worksheet_id: string
        }
        Update: {
          accepted?: boolean
          company_id?: string
          created_at?: string
          due_date?: string | null
          effort?: string | null
          horizon?: string | null
          id?: string
          impact?: string | null
          kind?: string
          owner_id?: string | null
          pushed_action_id?: string | null
          rationale?: string | null
          rule_key?: string | null
          sort_order?: number
          text?: string
          updated_at?: string
          worksheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "playbook_items_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: false
            referencedRelation: "playbook_worksheets"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_worksheets: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          goal_key: string
          hoshin_item_id: string | null
          id: string
          inputs: Json
          notes: string | null
          objective_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          goal_key: string
          hoshin_item_id?: string | null
          id?: string
          inputs?: Json
          notes?: string | null
          objective_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          goal_key?: string
          hoshin_item_id?: string | null
          id?: string
          inputs?: Json
          notes?: string | null
          objective_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_worksheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_worksheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "playbook_worksheets_hoshin_item_id_fkey"
            columns: ["hoshin_item_id"]
            isOneToOne: false
            referencedRelation: "hoshin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_worksheets_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_plan_steps: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          label: string
          module_id: string
          notes: string | null
          owner_id: string | null
          plan_id: string
          progress_pct: number
          sort_order: number
          status: Database["public"]["Enums"]["problem_step_status"]
          updated_at: string
          why: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          label: string
          module_id: string
          notes?: string | null
          owner_id?: string | null
          plan_id: string
          progress_pct?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          updated_at?: string
          why?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          label?: string
          module_id?: string
          notes?: string | null
          owner_id?: string | null
          plan_id?: string
          progress_pct?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          updated_at?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "problem_plan_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_plan_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "problem_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_plans: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          owner_id: string | null
          source_problem_id: string | null
          statement: string | null
          status: Database["public"]["Enums"]["problem_plan_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          source_problem_id?: string | null
          statement?: string | null
          status?: Database["public"]["Enums"]["problem_plan_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          owner_id?: string | null
          source_problem_id?: string | null
          statement?: string | null
          status?: Database["public"]["Enums"]["problem_plan_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      problem_step_actions: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          owner_id: string | null
          plan_id: string
          status: Database["public"]["Enums"]["problem_step_status"]
          step_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["problem_step_status"]
          step_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["problem_step_status"]
          step_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_step_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_step_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "problem_step_actions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_step_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "problem_plan_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      proficiency_levels: {
        Row: {
          color: string
          company_id: string | null
          description: string | null
          label: string
          level: number
        }
        Insert: {
          color: string
          company_id?: string | null
          description?: string | null
          label: string
          level: number
        }
        Update: {
          color?: string
          company_id?: string | null
          description?: string | null
          label?: string
          level?: number
        }
        Relationships: [
          {
            foreignKeyName: "proficiency_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proficiency_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_quota: number
          created_at: string
          display_name: string | null
          email: string | null
          free_started_at: string
          id: string
          manager_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_quota?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          free_started_at?: string
          id: string
          manager_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_quota?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          free_started_at?: string
          id?: string
          manager_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          account_id: string
          amount: number
          company_id: string
          contact_id: string | null
          created_at: string
          currency: string
          delivery_date: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          number: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number
          company_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          delivery_date?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          number?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          company_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string
          delivery_date?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          number?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restructuring_items: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          health: string | null
          id: string
          kind: string
          meta: Json
          owner_id: string | null
          parent_id: string | null
          progress: number
          project_id: string | null
          section: string
          sort_order: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
          workstream_id: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          health?: string | null
          id?: string
          kind: string
          meta?: Json
          owner_id?: string | null
          parent_id?: string | null
          progress?: number
          project_id?: string | null
          section: string
          sort_order?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          workstream_id?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          health?: string | null
          id?: string
          kind?: string
          meta?: Json
          owner_id?: string | null
          parent_id?: string | null
          progress?: number
          project_id?: string | null
          section?: string
          sort_order?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          workstream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restructuring_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restructuring_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restructuring_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "restructuring_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restructuring_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "restructuring_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restructuring_items_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "restructuring_items"
            referencedColumns: ["id"]
          },
        ]
      }
      restructuring_members: {
        Row: {
          body: string
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          project_id: string
          role: string | null
          sort_order: number
          updated_at: string
          user_id: string | null
          workstream_name: string | null
        }
        Insert: {
          body: string
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          project_id: string
          role?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
          workstream_name?: string | null
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          project_id?: string
          role?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
          workstream_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restructuring_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restructuring_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "restructuring_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "restructuring_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      restructuring_projects: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restructuring_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restructuring_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      review_notes: {
        Row: {
          company_id: string
          decisions: string | null
          id: string
          notes: string | null
          pillar_id: string
          review_id: string
        }
        Insert: {
          company_id?: string
          decisions?: string | null
          id?: string
          notes?: string | null
          pillar_id: string
          review_id: string
        }
        Update: {
          company_id?: string
          decisions?: string | null
          id?: string
          notes?: string | null
          pillar_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "review_notes_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          scheduled_for: string
          status: string
          title: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      role_requirements: {
        Row: {
          company_id: string
          id: string
          required_level: number
          role_id: string
          skill_id: string
        }
        Insert: {
          company_id?: string
          id?: string
          required_level: number
          role_id: string
          skill_id: string
        }
        Update: {
          company_id?: string
          id?: string
          required_level?: number
          role_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "role_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requirements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          anonymous: boolean
          closed_at: string | null
          company_id: string
          control_level: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string
          due_date: string | null
          effectiveness: string | null
          id: string
          immediate_action: string | null
          immediate_control: string | null
          likelihood: number
          location: string | null
          occurred_at: string
          owner_id: string | null
          permanent_action: string | null
          photo_path: string | null
          potential_consequence: string | null
          ref: string | null
          report_type: string
          reporter_name: string | null
          risk_score: number | null
          severity: number
          source: string
          status: string
          updated_at: string
          verified_by: string | null
          walk_id: string | null
        }
        Insert: {
          anonymous?: boolean
          closed_at?: string | null
          company_id: string
          control_level?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description: string
          due_date?: string | null
          effectiveness?: string | null
          id?: string
          immediate_action?: string | null
          immediate_control?: string | null
          likelihood?: number
          location?: string | null
          occurred_at?: string
          owner_id?: string | null
          permanent_action?: string | null
          photo_path?: string | null
          potential_consequence?: string | null
          ref?: string | null
          report_type?: string
          reporter_name?: string | null
          risk_score?: number | null
          severity?: number
          source?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
          walk_id?: string | null
        }
        Update: {
          anonymous?: boolean
          closed_at?: string | null
          company_id?: string
          control_level?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string
          due_date?: string | null
          effectiveness?: string | null
          id?: string
          immediate_action?: string | null
          immediate_control?: string | null
          likelihood?: number
          location?: string | null
          occurred_at?: string
          owner_id?: string | null
          permanent_action?: string | null
          photo_path?: string | null
          potential_consequence?: string | null
          ref?: string | null
          report_type?: string
          reporter_name?: string | null
          risk_score?: number | null
          severity?: number
          source?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
          walk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "safety_walks"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_walks: {
        Row: {
          area: string | null
          company_id: string
          created_at: string
          created_by: string | null
          department: string | null
          good_practices: string | null
          id: string
          led_by: string | null
          notes: string | null
          participants: string | null
          updated_at: string
          walk_date: string
          walk_type: string
        }
        Insert: {
          area?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          good_practices?: string | null
          id?: string
          led_by?: string | null
          notes?: string | null
          participants?: string | null
          updated_at?: string
          walk_date?: string
          walk_type?: string
        }
        Update: {
          area?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          good_practices?: string | null
          id?: string
          led_by?: string | null
          notes?: string | null
          participants?: string | null
          updated_at?: string
          walk_date?: string
          walk_type?: string
        }
        Relationships: []
      }
      sc_actions: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          owner_id: string | null
          source_id: string | null
          source_type: string | null
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_actions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_capacity: {
        Row: {
          archived_at: string | null
          available_units: number | null
          bottleneck: string | null
          company_id: string
          created_at: string
          demand_units: number | null
          id: string
          investment_plan: string | null
          labour_constraints: string | null
          max_units: number | null
          notes: string | null
          period: string
          supplier_id: string
          tooling_constraints: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          available_units?: number | null
          bottleneck?: string | null
          company_id: string
          created_at?: string
          demand_units?: number | null
          id?: string
          investment_plan?: string | null
          labour_constraints?: string | null
          max_units?: number | null
          notes?: string | null
          period: string
          supplier_id: string
          tooling_constraints?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          available_units?: number | null
          bottleneck?: string | null
          company_id?: string
          created_at?: string
          demand_units?: number | null
          id?: string
          investment_plan?: string | null
          labour_constraints?: string | null
          max_units?: number | null
          notes?: string | null
          period?: string
          supplier_id?: string
          tooling_constraints?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_capacity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_capacity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_capacity_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_categories: {
        Row: {
          annual_spend: number | null
          archived_at: string | null
          code: string | null
          company_id: string
          created_at: string
          current_state: string | null
          future_state: string | null
          id: string
          kpis: string | null
          market_assessment: string | null
          name: string
          owner_id: string | null
          parent_id: string | null
          refresh_date: string | null
          sort_order: number
          spend_analysis: string | null
          strategy_status: string
          supplier_count: number | null
          updated_at: string
        }
        Insert: {
          annual_spend?: number | null
          archived_at?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          current_state?: string | null
          future_state?: string | null
          id?: string
          kpis?: string | null
          market_assessment?: string | null
          name: string
          owner_id?: string | null
          parent_id?: string | null
          refresh_date?: string | null
          sort_order?: number
          spend_analysis?: string | null
          strategy_status?: string
          supplier_count?: number | null
          updated_at?: string
        }
        Update: {
          annual_spend?: number | null
          archived_at?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          current_state?: string | null
          future_state?: string | null
          id?: string
          kpis?: string | null
          market_assessment?: string | null
          name?: string
          owner_id?: string | null
          parent_id?: string | null
          refresh_date?: string | null
          sort_order?: number
          spend_analysis?: string | null
          strategy_status?: string
          supplier_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sc_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_contract_clauses: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_contract_clauses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_contract_clauses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_contracts: {
        Row: {
          archived_at: string | null
          capacity_reservation: string | null
          clauses: Json
          company_id: string
          contract_type: string | null
          created_at: string
          end_date: string | null
          escalation_mechanism: string | null
          id: string
          notes: string | null
          pricing_model: string | null
          review_date: string | null
          start_date: string | null
          status: string
          supplier_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          capacity_reservation?: string | null
          clauses?: Json
          company_id: string
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          escalation_mechanism?: string | null
          id?: string
          notes?: string | null
          pricing_model?: string | null
          review_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          capacity_reservation?: string | null
          clauses?: Json
          company_id?: string
          contract_type?: string | null
          created_at?: string
          end_date?: string | null
          escalation_mechanism?: string | null
          id?: string
          notes?: string | null
          pricing_model?: string | null
          review_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_development_plans: {
        Row: {
          activities: string | null
          archived_at: string | null
          benefit: string | null
          company_id: string
          created_at: string
          id: string
          objective: string
          owner_id: string | null
          status: string
          supplier_id: string
          target_date: string | null
          updated_at: string
          year: number
        }
        Insert: {
          activities?: string | null
          archived_at?: string | null
          benefit?: string | null
          company_id: string
          created_at?: string
          id?: string
          objective: string
          owner_id?: string | null
          status?: string
          supplier_id: string
          target_date?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          activities?: string | null
          archived_at?: string | null
          benefit?: string | null
          company_id?: string
          created_at?: string
          id?: string
          objective?: string
          owner_id?: string | null
          status?: string
          supplier_id?: string
          target_date?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sc_development_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_development_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_development_plans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_escalation_levels: {
        Row: {
          archived_at: string | null
          closure_criteria: string | null
          company_id: string
          created_at: string
          id: string
          level_no: number
          name: string
          owner_role: string | null
          required_actions: string | null
          response_hours: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closure_criteria?: string | null
          company_id: string
          created_at?: string
          id?: string
          level_no?: number
          name: string
          owner_role?: string | null
          required_actions?: string | null
          response_hours?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closure_criteria?: string | null
          company_id?: string
          created_at?: string
          id?: string
          level_no?: number
          name?: string
          owner_role?: string | null
          required_actions?: string | null
          response_hours?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_escalation_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_escalation_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_escalations: {
        Row: {
          actions: string | null
          archived_at: string | null
          closed_at: string | null
          closure_criteria: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          level_no: number
          opened_at: string
          owner_id: string | null
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actions?: string | null
          archived_at?: string | null
          closed_at?: string | null
          closure_criteria?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          level_no?: number
          opened_at?: string
          owner_id?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actions?: string | null
          archived_at?: string | null
          closed_at?: string | null
          closure_criteria?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          level_no?: number
          opened_at?: string
          owner_id?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_escalations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_escalations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_escalations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_onboarding_items: {
        Row: {
          archived_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          label: string
          notes: string | null
          owner_id: string | null
          sort_order: number
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          label: string
          notes?: string | null
          owner_id?: string | null
          sort_order?: number
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          label?: string
          notes?: string | null
          owner_id?: string | null
          sort_order?: number
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_onboarding_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_onboarding_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_onboarding_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_onboarding_templates: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_onboarding_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_onboarding_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_review_types: {
        Row: {
          agenda: string | null
          archived_at: string | null
          cadence: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          archived_at?: string | null
          cadence?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          archived_at?: string | null
          cadence?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_review_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_review_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_reviews: {
        Row: {
          archived_at: string | null
          attendees: string | null
          company_id: string
          created_at: string
          decisions: string | null
          id: string
          notes: string | null
          review_date: string | null
          review_type_id: string | null
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          attendees?: string | null
          company_id: string
          created_at?: string
          decisions?: string | null
          id?: string
          notes?: string | null
          review_date?: string | null
          review_type_id?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          attendees?: string | null
          company_id?: string
          created_at?: string
          decisions?: string | null
          id?: string
          notes?: string | null
          review_date?: string | null
          review_type_id?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_reviews_review_type_id_fkey"
            columns: ["review_type_id"]
            isOneToOne: false
            referencedRelation: "sc_review_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_risk_types: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_risk_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_risk_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_risks: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          impact: number
          likelihood: number
          mitigation: string | null
          owner_id: string | null
          review_date: string | null
          risk_type_id: string | null
          status: string
          supplier_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          impact?: number
          likelihood?: number
          mitigation?: string | null
          owner_id?: string | null
          review_date?: string | null
          risk_type_id?: string | null
          status?: string
          supplier_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          impact?: number
          likelihood?: number
          mitigation?: string | null
          owner_id?: string | null
          review_date?: string | null
          risk_type_id?: string | null
          status?: string
          supplier_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_risks_risk_type_id_fkey"
            columns: ["risk_type_id"]
            isOneToOne: false
            referencedRelation: "sc_risk_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_risks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_score_metrics: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          dimension: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          weight_pct: number
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          dimension?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          weight_pct?: number
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          dimension?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "sc_score_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_score_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_scorecard_scores: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          metric_id: string
          score: number
          scorecard_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          metric_id: string
          score?: number
          scorecard_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          metric_id?: string
          score?: number
          scorecard_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_scorecard_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_scorecard_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_scorecard_scores_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "sc_score_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_scorecard_scores_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "sc_scorecards"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_scorecards: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          period_month: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          period_month: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_scorecards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_scorecards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_scorecards_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_segments: {
        Row: {
          archived_at: string | null
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          governance: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          governance?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          governance?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_selection_candidates: {
        Row: {
          archived_at: string | null
          category_id: string | null
          company_id: string
          country: string | null
          created_at: string
          decision: string | null
          id: string
          name: string
          need: string | null
          owner_id: string | null
          score: number | null
          stage: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          name: string
          need?: string | null
          owner_id?: string | null
          score?: number | null
          stage?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          name?: string
          need?: string | null
          owner_id?: string | null
          score?: number | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_selection_candidates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_selection_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_selection_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_selection_gates: {
        Row: {
          archived_at: string | null
          candidate_id: string
          company_id: string
          created_at: string
          decided_at: string | null
          id: string
          name: string
          notes: string | null
          score: number | null
          seq: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          candidate_id: string
          company_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          name: string
          notes?: string | null
          score?: number | null
          seq?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          candidate_id?: string
          company_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          score?: number | null
          seq?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_selection_gates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "sc_selection_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_selection_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_selection_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sc_suppliers: {
        Row: {
          annual_spend: number | null
          archived_at: string | null
          as9100: boolean
          category_id: string | null
          code: string | null
          commodity_id: string | null
          company_id: string
          country: string | null
          created_at: string
          export_controlled: boolean
          id: string
          nadcap: boolean
          name: string
          notes: string | null
          owner_id: string | null
          segment_id: string | null
          site: string | null
          sole_source: boolean
          status: string
          updated_at: string
        }
        Insert: {
          annual_spend?: number | null
          archived_at?: string | null
          as9100?: boolean
          category_id?: string | null
          code?: string | null
          commodity_id?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          export_controlled?: boolean
          id?: string
          nadcap?: boolean
          name: string
          notes?: string | null
          owner_id?: string | null
          segment_id?: string | null
          site?: string | null
          sole_source?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          annual_spend?: number | null
          archived_at?: string | null
          as9100?: boolean
          category_id?: string | null
          code?: string | null
          commodity_id?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          export_controlled?: boolean
          id?: string
          nadcap?: boolean
          name?: string
          notes?: string | null
          owner_id?: string | null
          segment_id?: string | null
          site?: string | null
          sole_source?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_suppliers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_suppliers_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "sc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sc_suppliers_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "sc_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_floor_gates: {
        Row: {
          company_id: string
          created_at: string
          id: string
          line_id: string
          name: string
          red_wait_minutes: number
          seq: number
          updated_at: string
          wip_cap: number
          yellow_wait_minutes: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          line_id: string
          name: string
          red_wait_minutes?: number
          seq: number
          updated_at?: string
          wip_cap?: number
          yellow_wait_minutes?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          line_id?: string
          name?: string
          red_wait_minutes?: number
          seq?: number
          updated_at?: string
          wip_cap?: number
          yellow_wait_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_floor_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_floor_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "shop_floor_gates_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_floor_parts: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          current_gate_id: string | null
          id: string
          line_id: string
          part_number: string
          status: string
          status_since: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          current_gate_id?: string | null
          id?: string
          line_id: string
          part_number: string
          status?: string
          status_since?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          current_gate_id?: string | null
          id?: string
          line_id?: string
          part_number?: string
          status?: string
          status_since?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_floor_parts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_floor_parts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "shop_floor_parts_current_gate_id_fkey"
            columns: ["current_gate_id"]
            isOneToOne: false
            referencedRelation: "shop_floor_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_floor_parts_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      sic_actions: {
        Row: {
          company_id: string
          containment: string | null
          created_at: string
          escalation_level: number
          id: string
          interval_id: string | null
          opened_at: string
          owner_id: string | null
          owner_name: string | null
          problem: string
          resolved_at: string | null
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          containment?: string | null
          created_at?: string
          escalation_level?: number
          id?: string
          interval_id?: string | null
          opened_at?: string
          owner_id?: string | null
          owner_name?: string | null
          problem: string
          resolved_at?: string | null
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          containment?: string | null
          created_at?: string
          escalation_level?: number
          id?: string
          interval_id?: string | null
          opened_at?: string
          owner_id?: string | null
          owner_name?: string | null
          problem?: string
          resolved_at?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sic_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sic_actions_interval_id_fkey"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "sic_intervals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_actions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "sic_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sic_intervals: {
        Row: {
          actual_output: number | null
          company_id: string
          created_at: string
          end_at: string
          id: string
          note: string | null
          planned_target: number
          seq: number
          shift_id: string
          start_at: string
          updated_at: string
        }
        Insert: {
          actual_output?: number | null
          company_id: string
          created_at?: string
          end_at: string
          id?: string
          note?: string | null
          planned_target?: number
          seq: number
          shift_id: string
          start_at: string
          updated_at?: string
        }
        Update: {
          actual_output?: number | null
          company_id?: string
          created_at?: string
          end_at?: string
          id?: string
          note?: string | null
          planned_target?: number
          seq?: number
          shift_id?: string
          start_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sic_intervals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_intervals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sic_intervals_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "sic_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sic_loss_codes: {
        Row: {
          active: boolean
          category: string
          code: string
          company_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          code: string
          company_id: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sic_loss_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_loss_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sic_loss_entries: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          interval_id: string | null
          loss_code_id: string | null
          minutes: number
          shift_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          interval_id?: string | null
          loss_code_id?: string | null
          minutes?: number
          shift_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          interval_id?: string | null
          loss_code_id?: string | null
          minutes?: number
          shift_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sic_loss_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_loss_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sic_loss_entries_interval_id_fkey"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "sic_intervals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_loss_entries_loss_code_id_fkey"
            columns: ["loss_code_id"]
            isOneToOne: false
            referencedRelation: "sic_loss_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_loss_entries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "sic_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sic_shifts: {
        Row: {
          archived_at: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          id: string
          interval_count: number
          interval_minutes: number
          line_id: string | null
          line_name: string | null
          notes: string | null
          shift_date: string
          shift_label: string
          sqdcp: Json
          start_time: string
          target_per_interval: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          interval_count?: number
          interval_minutes?: number
          line_id?: string | null
          line_name?: string | null
          notes?: string | null
          shift_date?: string
          shift_label?: string
          sqdcp?: Json
          start_time?: string
          target_per_interval?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          interval_count?: number
          interval_minutes?: number
          line_id?: string | null
          line_name?: string | null
          notes?: string | null
          shift_date?: string
          shift_label?: string
          sqdcp?: Json
          start_time?: string
          target_per_interval?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sic_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sic_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sic_shifts_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "aps_value_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_capacity: {
        Row: {
          archived_at: string | null
          available_capacity: number | null
          company_id: string
          created_at: string
          cycle_id: string
          id: string
          mitigation: string | null
          monthly_values: Json
          notes: string | null
          required_capacity: number | null
          resource_name: string
          resource_type: string
          source: string
          source_ref: string | null
          status: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          available_capacity?: number | null
          company_id?: string
          created_at?: string
          cycle_id: string
          id?: string
          mitigation?: string | null
          monthly_values?: Json
          notes?: string | null
          required_capacity?: number | null
          resource_name: string
          resource_type: string
          source?: string
          source_ref?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          available_capacity?: number | null
          company_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
          mitigation?: string | null
          monthly_values?: Json
          notes?: string | null
          required_capacity?: number | null
          resource_name?: string
          resource_type?: string
          source?: string
          source_ref?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_capacity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_capacity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_capacity_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_cycles: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          current_step: number
          cycle_month: string
          id: string
          notes: string | null
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_step?: number
          cycle_month: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_step?: number
          cycle_month?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      siop_decisions: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          cycle_id: string
          decision: string
          due_date: string | null
          id: string
          owner_id: string | null
          rationale: string | null
          status: string | null
          step: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id?: string
          created_at?: string
          cycle_id: string
          decision: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          rationale?: string | null
          status?: string | null
          step?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          cycle_id?: string
          decision?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          rationale?: string | null
          status?: string | null
          step?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_decisions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_demand: {
        Row: {
          company_id: string
          created_at: string
          cycle_id: string
          firm_units: number | null
          id: string
          monthly_values: Json
          notes: string | null
          pipeline_units: number | null
          product_line: string
          revenue_estimate: number | null
          segment: string | null
          updated_at: string
          weighted_units: number | null
          workscope: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          cycle_id: string
          firm_units?: number | null
          id?: string
          monthly_values?: Json
          notes?: string | null
          pipeline_units?: number | null
          product_line: string
          revenue_estimate?: number | null
          segment?: string | null
          updated_at?: string
          weighted_units?: number | null
          workscope?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          cycle_id?: string
          firm_units?: number | null
          id?: string
          monthly_values?: Json
          notes?: string | null
          pipeline_units?: number | null
          product_line?: string
          revenue_estimate?: number | null
          segment?: string | null
          updated_at?: string
          weighted_units?: number | null
          workscope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siop_demand_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_demand_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_demand_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_kpis: {
        Row: {
          actual_value: number | null
          category: string | null
          company_id: string
          created_at: string
          cycle_id: string
          id: string
          kpi_name: string
          notes: string | null
          plan_value: number | null
          status: string | null
          updated_at: string
          variance: number | null
        }
        Insert: {
          actual_value?: number | null
          category?: string | null
          company_id?: string
          created_at?: string
          cycle_id: string
          id?: string
          kpi_name: string
          notes?: string | null
          plan_value?: number | null
          status?: string | null
          updated_at?: string
          variance?: number | null
        }
        Update: {
          actual_value?: number | null
          category?: string | null
          company_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
          kpi_name?: string
          notes?: string | null
          plan_value?: number | null
          status?: string | null
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "siop_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_kpis_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_long_lead_materials: {
        Row: {
          company_id: string
          created_at: string
          cycle_id: string
          expected_date: string | null
          form: string | null
          heat_lot: string | null
          id: string
          material: string
          need_by_date: string | null
          notes: string | null
          order_date: string | null
          owner_id: string | null
          part_numbers: string | null
          po_number: string | null
          program: string | null
          promised_date: string | null
          qty_ordered: number | null
          received_date: string | null
          risk: string | null
          spec: string | null
          status: string
          supplier: string | null
          unit_cost: number | null
          uom: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          cycle_id: string
          expected_date?: string | null
          form?: string | null
          heat_lot?: string | null
          id?: string
          material: string
          need_by_date?: string | null
          notes?: string | null
          order_date?: string | null
          owner_id?: string | null
          part_numbers?: string | null
          po_number?: string | null
          program?: string | null
          promised_date?: string | null
          qty_ordered?: number | null
          received_date?: string | null
          risk?: string | null
          spec?: string | null
          status?: string
          supplier?: string | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          cycle_id?: string
          expected_date?: string | null
          form?: string | null
          heat_lot?: string | null
          id?: string
          material?: string
          need_by_date?: string | null
          notes?: string | null
          order_date?: string | null
          owner_id?: string | null
          part_numbers?: string | null
          po_number?: string | null
          program?: string | null
          promised_date?: string | null
          qty_ordered?: number | null
          received_date?: string | null
          risk?: string | null
          spec?: string | null
          status?: string
          supplier?: string | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_long_lead_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_long_lead_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_long_lead_materials_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_long_lead_materials_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_osp_jobs: {
        Row: {
          actual_return_date: string | null
          company_id: string
          cost: number | null
          created_at: string
          cycle_id: string
          expected_return_date: string | null
          hold_reason: string | null
          id: string
          lot_qty: number | null
          nadcap_approved: boolean
          notes: string | null
          owner_id: string | null
          part_number: string | null
          process: string
          program: string | null
          promised_return_date: string | null
          risk: string | null
          ship_date: string | null
          spec: string | null
          status: string
          supplier: string | null
          tat_days_target: number | null
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          company_id?: string
          cost?: number | null
          created_at?: string
          cycle_id: string
          expected_return_date?: string | null
          hold_reason?: string | null
          id?: string
          lot_qty?: number | null
          nadcap_approved?: boolean
          notes?: string | null
          owner_id?: string | null
          part_number?: string | null
          process: string
          program?: string | null
          promised_return_date?: string | null
          risk?: string | null
          ship_date?: string | null
          spec?: string | null
          status?: string
          supplier?: string | null
          tat_days_target?: number | null
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          company_id?: string
          cost?: number | null
          created_at?: string
          cycle_id?: string
          expected_return_date?: string | null
          hold_reason?: string | null
          id?: string
          lot_qty?: number | null
          nadcap_approved?: boolean
          notes?: string | null
          owner_id?: string | null
          part_number?: string | null
          process?: string
          program?: string | null
          promised_return_date?: string | null
          risk?: string | null
          ship_date?: string | null
          spec?: string | null
          status?: string
          supplier?: string | null
          tat_days_target?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_osp_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_osp_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_osp_jobs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_osp_jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      siop_scenarios: {
        Row: {
          company_id: string
          cost_impact: number | null
          created_at: string
          cycle_id: string
          description: string | null
          ebitda_impact: number | null
          id: string
          notes: string | null
          option_label: string
          recommended: boolean | null
          revenue_impact: number | null
          risk_level: string | null
          selected: boolean | null
          tat_impact: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          cost_impact?: number | null
          created_at?: string
          cycle_id: string
          description?: string | null
          ebitda_impact?: number | null
          id?: string
          notes?: string | null
          option_label: string
          recommended?: boolean | null
          revenue_impact?: number | null
          risk_level?: string | null
          selected?: boolean | null
          tat_impact?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          cost_impact?: number | null
          created_at?: string
          cycle_id?: string
          description?: string | null
          ebitda_impact?: number | null
          id?: string
          notes?: string | null
          option_label?: string
          recommended?: boolean | null
          revenue_impact?: number | null
          risk_level?: string | null
          selected?: boolean | null
          tat_impact?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siop_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siop_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "siop_scenarios_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "siop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      skills: {
        Row: {
          archived_at: string | null
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_certification: boolean
          name: string
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_certification?: boolean
          name: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_certification?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      stakeholder_touchpoints: {
        Row: {
          account_id: string
          company_id: string
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string | null
          scheduled_at: string
          status: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          company_id?: string
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          scheduled_at?: string
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          company_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          scheduled_at?: string
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_touchpoints_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_touchpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_touchpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "stakeholder_touchpoints_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholder_touchpoints_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_limits: {
        Row: {
          company_id: string
          created_at: string
          max_bytes: number
          max_uploads_per_day: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          max_bytes?: number
          max_uploads_per_day?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          max_bytes?: number
          max_uploads_per_day?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      strategic_objectives: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          description: string | null
          horizon_year: number
          id: string
          owner_id: string | null
          source_waterfall_item_id: string | null
          stage: string
          status: Database["public"]["Enums"]["objective_status"]
          target_metric: string | null
          theme_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          horizon_year: number
          id?: string
          owner_id?: string | null
          source_waterfall_item_id?: string | null
          stage?: string
          status?: Database["public"]["Enums"]["objective_status"]
          target_metric?: string | null
          theme_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          horizon_year?: number
          id?: string
          owner_id?: string | null
          source_waterfall_item_id?: string | null
          stage?: string
          status?: Database["public"]["Enums"]["objective_status"]
          target_metric?: string | null
          theme_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "strategic_objectives_source_waterfall_item_id_fkey"
            columns: ["source_waterfall_item_id"]
            isOneToOne: false
            referencedRelation: "waterfall_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_objectives_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "strategic_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_themes: {
        Row: {
          archived_at: string | null
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_themes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_themes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      strategies: {
        Row: {
          company_id: string
          created_at: string
          horizon_start_year: number
          id: string
          mission: string | null
          updated_at: string
          vision: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          horizon_start_year?: number
          id?: string
          mission?: string | null
          updated_at?: string
          vision?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          horizon_start_year?: number
          id?: string
          mission?: string | null
          updated_at?: string
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sub_pillars: {
        Row: {
          company_id: string
          id: string
          name: string
          pillar_id: string
          sort_order: number
        }
        Insert: {
          company_id?: string
          id?: string
          name: string
          pillar_id: string
          sort_order?: number
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          pillar_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_pillars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_pillars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sub_pillars_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          close_reason: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          pillar_id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          sub_pillar_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          close_reason?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          pillar_id: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          sub_pillar_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          close_reason?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          pillar_id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          sub_pillar_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sub_pillar_id_fkey"
            columns: ["sub_pillar_id"]
            isOneToOne: false
            referencedRelation: "sub_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_analyses: {
        Row: {
          archived_at: string | null
          buffer_notes: string | null
          c2c_baseline: number | null
          c2c_current: number | null
          c2c_target: number | null
          company_id: string
          constraint_name: string | null
          created_at: string
          created_by: string | null
          dbr_notes: string | null
          id: string
          inventory: number | null
          operating_expense: number | null
          owner_id: string | null
          plan_id: string | null
          policy_constraints: Json
          system_scope: string | null
          throughput: number | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          buffer_notes?: string | null
          c2c_baseline?: number | null
          c2c_current?: number | null
          c2c_target?: number | null
          company_id: string
          constraint_name?: string | null
          created_at?: string
          created_by?: string | null
          dbr_notes?: string | null
          id?: string
          inventory?: number | null
          operating_expense?: number | null
          owner_id?: string | null
          plan_id?: string | null
          policy_constraints?: Json
          system_scope?: string | null
          throughput?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          buffer_notes?: string | null
          c2c_baseline?: number | null
          c2c_current?: number | null
          c2c_target?: number | null
          company_id?: string
          constraint_name?: string | null
          created_at?: string
          created_by?: string | null
          dbr_notes?: string | null
          id?: string
          inventory?: number | null
          operating_expense?: number | null
          owner_id?: string | null
          plan_id?: string | null
          policy_constraints?: Json
          system_scope?: string | null
          throughput?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "toc_analyses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "problem_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_candidates: {
        Row: {
          analysis_id: string
          capacity_note: string | null
          company_id: string
          created_at: string
          id: string
          is_constraint: boolean
          load_pct: number | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          analysis_id: string
          capacity_note?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_constraint?: boolean
          load_pct?: number | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          capacity_note?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_constraint?: boolean
          load_pct?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_candidates_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "toc_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      toc_steps: {
        Row: {
          analysis_id: string
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["problem_step_status"]
          step: number
          title: string
          updated_at: string
        }
        Insert: {
          analysis_id: string
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          step?: number
          title: string
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["problem_step_status"]
          step?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_steps_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "toc_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      training_actions: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          name: string
          provider: string | null
          skill_id: string | null
          target_level: number | null
        }
        Insert: {
          action_type?: string
          company_id?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name: string
          provider?: string | null
          skill_id?: string | null
          target_level?: number | null
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name?: string
          provider?: string | null
          skill_id?: string | null
          target_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "training_actions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_company: {
        Row: {
          company_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_active_company_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          action_views: Json
          actions_default_group: string | null
          actions_default_view: string | null
          actions_default_zoom: string | null
          demo_presets: Json
          hidden_keys: string[]
          meeting_presets: Json
          meeting_steps: string[] | null
          overview_how_it_works_collapsed: boolean
          overview_show_all_chips: boolean
          saved_presets: Json
          tour_state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_views?: Json
          actions_default_group?: string | null
          actions_default_view?: string | null
          actions_default_zoom?: string | null
          demo_presets?: Json
          hidden_keys?: string[]
          meeting_presets?: Json
          meeting_steps?: string[] | null
          overview_how_it_works_collapsed?: boolean
          overview_show_all_chips?: boolean
          saved_presets?: Json
          tour_state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_views?: Json
          actions_default_group?: string | null
          actions_default_view?: string | null
          actions_default_zoom?: string | null
          demo_presets?: Json
          hidden_keys?: string[]
          meeting_presets?: Json
          meeting_steps?: string[] | null
          overview_how_it_works_collapsed?: boolean
          overview_show_all_chips?: boolean
          saved_presets?: Json
          tour_state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      voc_metrics: {
        Row: {
          account_id: string | null
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          csat: number | null
          id: string
          note: string | null
          nps: number | null
          period: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          csat?: number | null
          id?: string
          note?: string | null
          nps?: number | null
          period: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          csat?: number | null
          id?: string
          note?: string | null
          nps?: number | null
          period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voc_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voc_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voc_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      voc_notes: {
        Row: {
          account_id: string | null
          archived_at: string | null
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["voc_note_kind"]
          position: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          archived_at?: string | null
          company_id: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["voc_note_kind"]
          position?: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          archived_at?: string | null
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["voc_note_kind"]
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voc_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voc_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voc_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      voc_tasks: {
        Row: {
          account_id: string | null
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          position: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          position?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          position?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voc_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vsm_info_flows: {
        Row: {
          company_id: string
          created_at: string
          frequency: string | null
          id: string
          kind: string
          label: string
          map_id: string
          state: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          frequency?: string | null
          id?: string
          kind: string
          label: string
          map_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          frequency?: string | null
          id?: string
          kind?: string
          label?: string
          map_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vsm_info_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vsm_info_flows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vsm_info_flows_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "vsm_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      vsm_inventories: {
        Row: {
          after_step_position: number
          company_id: string
          created_at: string
          id: string
          map_id: string
          notes: string | null
          quantity: number | null
          state: string
          updated_at: string
        }
        Insert: {
          after_step_position?: number
          company_id?: string
          created_at?: string
          id?: string
          map_id: string
          notes?: string | null
          quantity?: number | null
          state?: string
          updated_at?: string
        }
        Update: {
          after_step_position?: number
          company_id?: string
          created_at?: string
          id?: string
          map_id?: string
          notes?: string | null
          quantity?: number | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vsm_inventories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vsm_inventories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vsm_inventories_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "vsm_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      vsm_maps: {
        Row: {
          archived_at: string | null
          available_time_sec: number | null
          company_id: string
          created_at: string
          created_by: string | null
          customer: string | null
          demand_per_period: number | null
          description: string | null
          id: string
          notes: string | null
          owner_id: string | null
          period_label: string | null
          product_family: string | null
          shifts: number | null
          sort_order: number
          title: string
          updated_at: string
          working_time_per_shift_min: number | null
        }
        Insert: {
          archived_at?: string | null
          available_time_sec?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer?: string | null
          demand_per_period?: number | null
          description?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          period_label?: string | null
          product_family?: string | null
          shifts?: number | null
          sort_order?: number
          title: string
          updated_at?: string
          working_time_per_shift_min?: number | null
        }
        Update: {
          archived_at?: string | null
          available_time_sec?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer?: string | null
          demand_per_period?: number | null
          description?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          period_label?: string | null
          product_family?: string | null
          shifts?: number | null
          sort_order?: number
          title?: string
          updated_at?: string
          working_time_per_shift_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vsm_maps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vsm_maps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vsm_maps_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vsm_steps: {
        Row: {
          batch_size: number | null
          changeover_sec: number | null
          company_id: string
          created_at: string
          cycle_time_sec: number | null
          first_pass_yield_pct: number | null
          id: string
          map_id: string
          name: string
          notes: string | null
          operators: number | null
          position: number
          scrap_pct: number | null
          shifts: number | null
          state: string
          updated_at: string
          uptime_pct: number | null
          working_time_per_shift_min: number | null
        }
        Insert: {
          batch_size?: number | null
          changeover_sec?: number | null
          company_id?: string
          created_at?: string
          cycle_time_sec?: number | null
          first_pass_yield_pct?: number | null
          id?: string
          map_id: string
          name: string
          notes?: string | null
          operators?: number | null
          position?: number
          scrap_pct?: number | null
          shifts?: number | null
          state?: string
          updated_at?: string
          uptime_pct?: number | null
          working_time_per_shift_min?: number | null
        }
        Update: {
          batch_size?: number | null
          changeover_sec?: number | null
          company_id?: string
          created_at?: string
          cycle_time_sec?: number | null
          first_pass_yield_pct?: number | null
          id?: string
          map_id?: string
          name?: string
          notes?: string | null
          operators?: number | null
          position?: number
          scrap_pct?: number | null
          shifts?: number | null
          state?: string
          updated_at?: string
          uptime_pct?: number | null
          working_time_per_shift_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vsm_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vsm_steps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "vsm_steps_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "vsm_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      waterfall_bridges: {
        Row: {
          archived_at: string | null
          baseline_label: string
          baseline_value: number
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          discount_rate_pct: number
          end_date: string | null
          end_period: string | null
          id: string
          metric: Database["public"]["Enums"]["waterfall_metric"]
          metric_label: string | null
          notes: string | null
          owner_id: string | null
          start_date: string | null
          start_period: string | null
          target_label: string
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          baseline_label?: string
          baseline_value?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_rate_pct?: number
          end_date?: string | null
          end_period?: string | null
          id?: string
          metric?: Database["public"]["Enums"]["waterfall_metric"]
          metric_label?: string | null
          notes?: string | null
          owner_id?: string | null
          start_date?: string | null
          start_period?: string | null
          target_label?: string
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          baseline_label?: string
          baseline_value?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_rate_pct?: number
          end_date?: string | null
          end_period?: string | null
          id?: string
          metric?: Database["public"]["Enums"]["waterfall_metric"]
          metric_label?: string | null
          notes?: string | null
          owner_id?: string | null
          start_date?: string | null
          start_period?: string | null
          target_label?: string
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      waterfall_item_kpi_values: {
        Row: {
          actual: number | null
          company_id: string
          created_at: string
          id: string
          kpi_id: string
          note: string | null
          period_start: string
          updated_at: string
        }
        Insert: {
          actual?: number | null
          company_id: string
          created_at?: string
          id?: string
          kpi_id: string
          note?: string | null
          period_start: string
          updated_at?: string
        }
        Update: {
          actual?: number | null
          company_id?: string
          created_at?: string
          id?: string
          kpi_id?: string
          note?: string | null
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waterfall_item_kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waterfall_item_kpi_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "waterfall_item_kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "waterfall_item_kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      waterfall_item_kpis: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          frequency: string
          higher_is_better: boolean
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["objective_kpi_kind"]
          name: string
          owner_id: string | null
          sort_order: number
          target: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          frequency?: string
          higher_is_better?: boolean
          id?: string
          item_id: string
          kind?: Database["public"]["Enums"]["objective_kpi_kind"]
          name: string
          owner_id?: string | null
          sort_order?: number
          target?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          frequency?: string
          higher_is_better?: boolean
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["objective_kpi_kind"]
          name?: string
          owner_id?: string | null
          sort_order?: number
          target?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waterfall_item_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waterfall_item_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "waterfall_item_kpis_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "waterfall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      waterfall_item_monthly_benefits: {
        Row: {
          actual: number
          company_id: string
          created_at: string
          id: string
          item_id: string
          month: number
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          actual?: number
          company_id: string
          created_at?: string
          id?: string
          item_id: string
          month: number
          updated_at?: string
          value?: number
          year: number
        }
        Update: {
          actual?: number
          company_id?: string
          created_at?: string
          id?: string
          item_id?: string
          month?: number
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "waterfall_item_monthly_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waterfall_item_monthly_benefits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "waterfall_item_monthly_benefits_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "waterfall_items"
            referencedColumns: ["id"]
          },
        ]
      }
      waterfall_items: {
        Row: {
          archived_at: string | null
          bridge_id: string
          category: Database["public"]["Enums"]["waterfall_category"]
          company_id: string
          created_at: string
          gross_impact: number
          id: string
          kpi: string | null
          label: string
          milestone_quarter: string | null
          notes: string | null
          owner_id: string | null
          program_manager: string | null
          realization_pct: number
          sort_order: number
          strategic_theme_id: string | null
          target_month: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          bridge_id: string
          category?: Database["public"]["Enums"]["waterfall_category"]
          company_id?: string
          created_at?: string
          gross_impact?: number
          id?: string
          kpi?: string | null
          label: string
          milestone_quarter?: string | null
          notes?: string | null
          owner_id?: string | null
          program_manager?: string | null
          realization_pct?: number
          sort_order?: number
          strategic_theme_id?: string | null
          target_month?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          bridge_id?: string
          category?: Database["public"]["Enums"]["waterfall_category"]
          company_id?: string
          created_at?: string
          gross_impact?: number
          id?: string
          kpi?: string | null
          label?: string
          milestone_quarter?: string | null
          notes?: string | null
          owner_id?: string | null
          program_manager?: string | null
          realization_pct?: number
          sort_order?: number
          strategic_theme_id?: string | null
          target_month?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waterfall_items_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "waterfall_bridges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waterfall_items_strategic_theme_id_fkey"
            columns: ["strategic_theme_id"]
            isOneToOne: false
            referencedRelation: "strategic_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      working_capital_items: {
        Row: {
          action: string | null
          archived_at: string | null
          category: string
          company_id: string
          created_at: string
          currency: string
          current_value: number
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          realized_date: string | null
          realized_value: number
          status: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          action?: string | null
          archived_at?: string | null
          category: string
          company_id?: string
          created_at?: string
          currency?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          realized_date?: string | null
          realized_value?: number
          status?: string
          target_value?: number
          title: string
          updated_at?: string
        }
        Update: {
          action?: string | null
          archived_at?: string | null
          category?: string
          company_id?: string
          created_at?: string
          currency?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          realized_date?: string | null
          realized_value?: number
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_capital_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_capital_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      working_capital_kpis: {
        Row: {
          ap_total: number | null
          ar_total: number | null
          company_id: string
          created_at: string
          dio: number | null
          dpo: number | null
          dso: number | null
          id: string
          inventory_total: number | null
          month: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          ap_total?: number | null
          ar_total?: number | null
          company_id?: string
          created_at?: string
          dio?: number | null
          dpo?: number | null
          dso?: number | null
          id?: string
          inventory_total?: number | null
          month: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          ap_total?: number | null
          ar_total?: number | null
          company_id?: string
          created_at?: string
          dio?: number | null
          dpo?: number | null
          dso?: number | null
          id?: string
          inventory_total?: number | null
          month?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_capital_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_capital_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
        ]
      }
      workstreams: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          source_bridge_id: string | null
          target_value_usd: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name: string
          source_bridge_id?: string | null
          target_value_usd?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          source_bridge_id?: string | null
          target_value_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstreams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstreams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_entitlements"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "workstreams_source_bridge_id_fkey"
            columns: ["source_bridge_id"]
            isOneToOne: true
            referencedRelation: "waterfall_bridges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      company_entitlements: {
        Row: {
          addon_keys: string[] | null
          addons_price: number | null
          billing_period: string | null
          cancel_at_period_end: boolean | null
          company_id: string | null
          company_name: string | null
          currency: string | null
          environment: string | null
          is_valid: boolean | null
          plan_key: string | null
          plan_price: number | null
          price_note: string | null
          pricing_mode: string | null
          seats: number | null
          seats_used: number | null
          status: string | null
          term_end: string | null
          term_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_pending_invites: { Args: never; Returns: number }
      ai_limit_for: {
        Args: { _company: string; _user: string }
        Returns: number
      }
      ai_usage_this_month: {
        Args: { _company?: string; _user: string }
        Returns: number
      }
      can_create_company: { Args: { _user?: string }; Returns: boolean }
      company_is_entitled: { Args: { _company: string }; Returns: boolean }
      company_seats_used: { Args: { _company: string }; Returns: number }
      company_storage_under_limit: {
        Args: { _company: string }
        Returns: boolean
      }
      company_storage_usage: {
        Args: { _company: string }
        Returns: {
          max_bytes: number
          max_uploads_per_day: number
          uploads_today: number
          used_bytes: number
        }[]
      }
      company_subscription_status: {
        Args: { _company: string }
        Returns: {
          is_valid: boolean
          plan_key: string
          seats: number
          status: string
          term_end: string
          term_start: string
        }[]
      }
      current_company_id: { Args: never; Returns: string }
      demo_persona_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      duplicate_company: {
        Args: { _new_name: string; _source: string }
        Returns: string
      }
      duplicate_company_impl: {
        Args: { _new_name: string; _source: string }
        Returns: string
      }
      effective_price: {
        Args: {
          _amount: number
          _custom: number
          _list: number
          _mode: string
          _pct: number
        }
        Returns: number
      }
      ensure_sample_company: { Args: never; Returns: undefined }
      has_addon: { Args: { _company: string; _key: string }; Returns: boolean }
      has_module_access: {
        Args: { _company: string; _key: string }
        Returns: boolean
      }
      has_profile_email: { Args: { _id: string }; Returns: boolean }
      has_role:
        | {
            Args: {
              _company_id: string
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      has_write_access: { Args: { _company: string }; Returns: boolean }
      is_company_admin: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user?: string }; Returns: boolean }
      join_showcase_company: { Args: never; Returns: undefined }
      my_access_level: {
        Args: { _company: string }
        Returns: Database["public"]["Enums"]["access_level"]
      }
      profile_emails_for: {
        Args: { _ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      roadmap_workstream_id:
        | { Args: never; Returns: string }
        | { Args: { _company_id: string }; Returns: string }
      search_profile_ids_by_email: {
        Args: { _needle: string }
        Returns: {
          id: string
        }[]
      }
      seed_supply_chain_defaults: {
        Args: { _company: string }
        Returns: undefined
      }
    }
    Enums: {
      a3_status: "draft" | "active" | "completed" | "archived"
      access_level: "read" | "write" | "admin"
      app_role: "admin" | "exec" | "manager" | "contributor" | "leader"
      calendar_event_type: "visit" | "audit" | "meeting" | "other" | "event"
      capex_health: "green" | "yellow" | "red"
      capex_stage:
        | "request"
        | "approval"
        | "procurement"
        | "installation"
        | "validation"
        | "closed"
      capex_status:
        | "not_started"
        | "in_progress"
        | "on_hold"
        | "at_risk"
        | "blocked"
        | "done"
      capex_strategic_objective:
        | "operational_efficiency"
        | "capacity_scaling"
        | "supply_chain_resilience"
        | "sustainability_compliance"
        | "safety_quality"
        | "other"
      company_role: "owner" | "admin" | "member"
      consolidation_bucket: "fixed" | "variable"
      consolidation_phase_status: "not_started" | "in_progress" | "done"
      consolidation_status: "planning" | "approved" | "in_progress" | "complete"
      consolidation_transition_cat: "direct_transfer" | "double_running" | "pmo"
      contract_status: "draft" | "active" | "expired" | "terminated" | "renewed"
      dm_category: "safety" | "people" | "quality" | "delivery"
      dm_loop_state:
        | "contain"
        | "cause"
        | "countermeasure"
        | "standardised"
        | "closed"
      dm_metric_direction: "higher_better" | "lower_better"
      dm_status: "green" | "red"
      dmaic_phase: "define" | "measure" | "analyze" | "improve" | "control"
      dmaic_status: "draft" | "active" | "completed" | "archived"
      eight_d_severity: "low" | "medium" | "high" | "critical"
      eight_d_status:
        | "draft"
        | "open"
        | "containment"
        | "verification"
        | "closed"
        | "archived"
      fishbone_status: "draft" | "active" | "completed" | "archived"
      five_whys_status: "draft" | "active" | "completed" | "archived"
      hoshin_correlation: "strong" | "weak"
      hoshin_kind: "long_term" | "annual" | "priority" | "kpi"
      initiative_stage: "L0" | "L1" | "L2" | "L3" | "L4" | "L5"
      interaction_type: "call" | "email" | "meeting" | "note" | "update"
      objective_action_status: "open" | "in_progress" | "done" | "blocked"
      objective_kpi_kind: "leading" | "lagging"
      objective_status: "not_started" | "on_track" | "at_risk" | "done"
      opportunity_stage: "prospect" | "proposal" | "won" | "lost"
      pillar_health: "green" | "yellow" | "red"
      pillar_note_kind: "working_well" | "can_improve"
      problem_plan_status: "draft" | "active" | "on_hold" | "complete"
      problem_step_status: "not_started" | "in_progress" | "blocked" | "done"
      quote_status:
        | "draft"
        | "sent"
        | "negotiating"
        | "approved"
        | "closed_won"
        | "closed_lost"
      task_priority: "low" | "med" | "high" | "urgent"
      task_status: "backlog" | "todo" | "in_progress" | "blocked" | "done"
      voc_note_kind: "works_well" | "can_improve"
      waterfall_category:
        | "headwind"
        | "organic_growth"
        | "new_strategy"
        | "efficiency"
        | "investment"
        | "other"
      waterfall_metric: "sales" | "ebit" | "ebitda" | "free_cash_flow" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      a3_status: ["draft", "active", "completed", "archived"],
      access_level: ["read", "write", "admin"],
      app_role: ["admin", "exec", "manager", "contributor", "leader"],
      calendar_event_type: ["visit", "audit", "meeting", "other", "event"],
      capex_health: ["green", "yellow", "red"],
      capex_stage: [
        "request",
        "approval",
        "procurement",
        "installation",
        "validation",
        "closed",
      ],
      capex_status: [
        "not_started",
        "in_progress",
        "on_hold",
        "at_risk",
        "blocked",
        "done",
      ],
      capex_strategic_objective: [
        "operational_efficiency",
        "capacity_scaling",
        "supply_chain_resilience",
        "sustainability_compliance",
        "safety_quality",
        "other",
      ],
      company_role: ["owner", "admin", "member"],
      consolidation_bucket: ["fixed", "variable"],
      consolidation_phase_status: ["not_started", "in_progress", "done"],
      consolidation_status: ["planning", "approved", "in_progress", "complete"],
      consolidation_transition_cat: [
        "direct_transfer",
        "double_running",
        "pmo",
      ],
      contract_status: ["draft", "active", "expired", "terminated", "renewed"],
      dm_category: ["safety", "people", "quality", "delivery"],
      dm_loop_state: [
        "contain",
        "cause",
        "countermeasure",
        "standardised",
        "closed",
      ],
      dm_metric_direction: ["higher_better", "lower_better"],
      dm_status: ["green", "red"],
      dmaic_phase: ["define", "measure", "analyze", "improve", "control"],
      dmaic_status: ["draft", "active", "completed", "archived"],
      eight_d_severity: ["low", "medium", "high", "critical"],
      eight_d_status: [
        "draft",
        "open",
        "containment",
        "verification",
        "closed",
        "archived",
      ],
      fishbone_status: ["draft", "active", "completed", "archived"],
      five_whys_status: ["draft", "active", "completed", "archived"],
      hoshin_correlation: ["strong", "weak"],
      hoshin_kind: ["long_term", "annual", "priority", "kpi"],
      initiative_stage: ["L0", "L1", "L2", "L3", "L4", "L5"],
      interaction_type: ["call", "email", "meeting", "note", "update"],
      objective_action_status: ["open", "in_progress", "done", "blocked"],
      objective_kpi_kind: ["leading", "lagging"],
      objective_status: ["not_started", "on_track", "at_risk", "done"],
      opportunity_stage: ["prospect", "proposal", "won", "lost"],
      pillar_health: ["green", "yellow", "red"],
      pillar_note_kind: ["working_well", "can_improve"],
      problem_plan_status: ["draft", "active", "on_hold", "complete"],
      problem_step_status: ["not_started", "in_progress", "blocked", "done"],
      quote_status: [
        "draft",
        "sent",
        "negotiating",
        "approved",
        "closed_won",
        "closed_lost",
      ],
      task_priority: ["low", "med", "high", "urgent"],
      task_status: ["backlog", "todo", "in_progress", "blocked", "done"],
      voc_note_kind: ["works_well", "can_improve"],
      waterfall_category: [
        "headwind",
        "organic_growth",
        "new_strategy",
        "efficiency",
        "investment",
        "other",
      ],
      waterfall_metric: ["sales", "ebit", "ebitda", "free_cash_flow", "other"],
    },
  },
} as const
