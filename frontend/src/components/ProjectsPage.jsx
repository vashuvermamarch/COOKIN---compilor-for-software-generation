import React, { useState, useEffect } from 'react';
import {
  Folder, CheckCircle, AlertTriangle, Wrench, Clock, Percent,
  FileText, Layout, Database, Terminal, ShieldCheck, HeartPulse, Play
} from 'lucide-react';
import Sandbox from './Sandbox';

export const MOCK_PROJECTS = [
  {
    id: 'crm',
    title: 'CRM Project',
    prompt: 'Create a SaaS CRM portal with contact database, lead assignment workflow, and deal pipeline management.',
    intent: {
      app_name: 'SaaS CRM Suite',
      app_type: 'Customer Relationship Management',
      entities: ['Lead', 'Contact', 'Deal', 'Activity', 'User'],
      features: ['Lead Scoring', 'Pipeline Stage Tracker', 'Meeting Logs', 'Deal Forecasting'],
      roles: ['Sales Agent', 'Sales Manager', 'Admin'],
      permissions: ['view_leads', 'edit_leads', 'manage_deals']
    },
    architecture: {
      database_design: {
        tables: ['users', 'leads', 'deals', 'activities']
      },
      api_design: {
        endpoints: ['GET /api/leads', 'POST /api/leads', 'GET /api/deals', 'POST /api/deals']
      },
      ui_design: {
        pages: ['leads', 'deals']
      }
    },
    dbSchema: {
      tables: [
        {
          table_name: 'users',
          columns: [
            { name: 'id', type: 'integer', primary_key: true },
            { name: 'email', type: 'text', unique: true },
            { name: 'role', type: 'text' }
          ]
        },
        {
          table_name: 'leads',
          columns: [
            { name: 'id', type: 'integer', primary_key: true },
            { name: 'company', type: 'text' },
            { name: 'status', type: 'text' }
          ]
        }
      ]
    },
    apiSchema: {
      apis: [
        { path: '/api/leads', method: 'GET', auth_required: true, roles_allowed: ['Sales Agent', 'Sales Manager', 'Admin'] },
        { path: '/api/leads', method: 'POST', auth_required: true, roles_allowed: ['Sales Agent', 'Admin'] }
      ]
    },
    uiSchema: {
      pages: [
        {
          name: 'Leads Dashboard',
          route: '/leads',
          components: [
            {
              type: 'sidebar',
              id: 'crm_side',
              title: 'CRM Console',
              props: { items: [{ label: 'Leads', route: '/leads' }, { label: 'Deals', route: '/deals' }] }
            },
            {
              type: 'table',
              id: 'leads_table',
              title: 'Active Leads',
              props: { api_endpoint: '/api/leads', columns: ['id', 'company', 'status'] }
            }
          ]
        }
      ]
    },
    validationReport: {
      valid: true,
      errors: [],
      checks: [
        { name: 'Valid JSON', status: 'Passed' },
        { name: 'APIs match DB', status: 'Passed' },
        { name: 'UI matches APIs', status: 'Passed' },
        { name: 'Roles exist', status: 'Passed' }
      ]
    },
    repairLogs: {
      repair_count: 2,
      issues_fixed: [
        "API field mismatch (GET /api/leads mapped to leads_table)",
        "Roles mismatch (Sales Agent role mapped to active routing)"
      ]
    },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/leads', page_name: 'Leads Dashboard' }],
        components: [
          {
            type: 'sidebar',
            id: 'crm_side',
            title: 'CRM Console',
            props: { items: [{ label: 'Leads', route: '/leads' }, { label: 'Deals', route: '/deals' }] }
          },
          {
            type: 'table',
            id: 'leads_table',
            title: 'Active Leads',
            props: { api_endpoint: '/api/leads', columns: ['id', 'company', 'status'] }
          }
        ],
        state: {
          leads: [
            { id: 1, company: 'Acme Corp', status: 'New Lead' },
            { id: 2, company: 'Stark Industries', status: 'Contacted' }
          ]
        }
      }
    }
  },
  {
    id: 'lms',
    title: 'LMS Project',
    prompt: 'Build an LMS system with Student Login, Teacher Login, Course Management, Assignments, and Progress Tracking.',
    intent: {
      app_name: 'Academy LMS',
      app_type: 'Learning Management System',
      entities: ['Course', 'Assignment', 'Submission', 'User'],
      features: ['Course enrollment', 'Assignment submission', 'Grades progress tracker'],
      roles: ['Student', 'Teacher', 'Admin'],
      permissions: ['view_courses', 'submit_assignments', 'grade_submissions']
    },
    architecture: {
      database_design: {
        tables: ['users', 'courses', 'assignments', 'submissions']
      },
      api_design: {
        endpoints: ['GET /api/courses', 'POST /api/courses', 'GET /api/submissions', 'POST /api/submissions']
      },
      ui_design: {
        pages: ['courses', 'submissions']
      }
    },
    dbSchema: {
      tables: [
        {
          table_name: 'courses',
          columns: [
            { name: 'id', type: 'integer', primary_key: true },
            { name: 'title', type: 'text' },
            { name: 'teacher_name', type: 'text' }
          ]
        }
      ]
    },
    apiSchema: {
      apis: [
        { path: '/api/courses', method: 'GET', auth_required: true, roles_allowed: ['Student', 'Teacher'] }
      ]
    },
    uiSchema: {
      pages: [
        {
          name: 'Courses Dashboard',
          route: '/courses',
          components: [
            {
              type: 'navbar',
              id: 'lms_nav',
              title: 'LMS Platform',
              props: { links: [{ label: 'Courses', href: '/courses' }] }
            },
            {
              type: 'table',
              id: 'courses_grid',
              title: 'All Enrolled Courses',
              props: { api_endpoint: '/api/courses', columns: ['id', 'title', 'teacher_name'] }
            }
          ]
        }
      ]
    },
    validationReport: {
      valid: true,
      errors: [],
      checks: [
        { name: 'Valid JSON', status: 'Passed' },
        { name: 'APIs match DB', status: 'Passed' },
        { name: 'UI matches APIs', status: 'Passed' }
      ]
    },
    repairLogs: {
      repair_count: 1,
      issues_fixed: [
        "Self-healed submissions schema layout definition"
      ]
    },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/courses', page_name: 'Courses Dashboard' }],
        components: [
          {
            type: 'navbar',
            id: 'lms_nav',
            title: 'LMS Platform',
            props: { links: [{ label: 'Courses', href: '/courses' }] }
          },
          {
            type: 'table',
            id: 'courses_grid',
            title: 'All Enrolled Courses',
            props: { api_endpoint: '/api/courses', columns: ['id', 'title', 'teacher_name'] }
          }
        ],
        state: {
          courses: [
            { id: 101, title: 'Introduction to Web Dev', teacher_name: 'Dr. Sarah Connor' },
            { id: 102, title: 'Data Structures & Algorithms', teacher_name: 'Prof. Albus D.' }
          ]
        }
      }
    }
  },
  {
    id: 'task-planner',
    title: 'Task Planner Project',
    prompt: 'Build a clean Task Planner app with projects list, team roles, status tracker columns, and due alerts.',
    intent: { app_name: 'Team Planner', app_type: 'Task Management', entities: ['Task', 'Project', 'User'], features: ['Task tracking', 'Column boards'], roles: ['Admin', 'Member'] },
    architecture: { database_design: { tables: ['projects', 'tasks'] }, api_design: { endpoints: ['GET /api/tasks', 'POST /api/tasks'] }, ui_design: { pages: ['board'] } },
    dbSchema: { tables: [{ table_name: 'tasks', columns: [{ name: 'id', type: 'integer' }, { name: 'title', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/tasks', method: 'GET', auth_required: true, roles_allowed: ['Admin', 'Member'] }] },
    uiSchema: { pages: [{ name: 'Task Board', route: '/board', components: [{ type: 'table', id: 'board_table', props: { columns: ['id', 'title'] } }] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 1, issues_fixed: ['Auto-repaired due date field column mismatch'] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/board', page_name: 'Task Board' }],
        components: [
          { type: 'sidebar', id: 'tp_side', title: 'Planner', props: { items: [{ label: 'Board', route: '/board' }] } },
          { type: 'form', id: 'task_form', title: 'Create a Task', props: { api_endpoint: '/api/tasks', fields: [{ name: 'title', label: 'Task Title' }, { name: 'project_id', label: 'Project ID', type: 'integer' }, { name: 'priority', label: 'Priority (High/Med/Low)' }] } },
          { type: 'table', id: 'board_table', title: 'My Tasks', props: { api_endpoint: '/api/tasks', columns: ['id', 'title', 'status', 'priority', 'project_id'], _page_route: '/board' } }
        ],
        state: {
          tasks: [
            { id: 1, title: 'Configure project dependencies', status: 'Done', priority: 'High', project_id: 1 },
            { id: 2, title: 'Write semantic compilation validators', status: 'In Progress', priority: 'High', project_id: 1 },
            { id: 3, title: 'Implement visual rendering engine', status: 'Todo', priority: 'Medium', project_id: 1 }
          ]
        }
      }
    }
  },
  {
    id: 'e-shop',
    title: 'E-Shop Console',
    prompt: 'Create an E-Commerce shop dashboard with product stock inventory, product cards list, and user shopping cart checkout.',
    intent: { app_name: 'E-Shop Console', app_type: 'E-Commerce', entities: ['Product', 'Cart', 'Order'], features: ['Inventory', 'Checkout'], roles: ['Buyer', 'Seller'] },
    architecture: { database_design: { tables: ['products', 'orders'] }, api_design: { endpoints: ['GET /api/products'] }, ui_design: { pages: ['shop'] } },
    dbSchema: { tables: [{ table_name: 'products', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'text' }, { name: 'price', type: 'integer' }, { name: 'stock_count', type: 'integer' }] }] },
    apiSchema: { apis: [{ path: '/api/products', method: 'GET', auth_required: false }] },
    uiSchema: { pages: [{ name: 'Store', route: '/shop', components: [{ type: 'table', id: 'prod_grid', props: { columns: ['id', 'name', 'price', 'stock_count'] } }] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 1, issues_fixed: ['Patched inventory stock endpoint bounds validation'] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/shop', page_name: 'Store' }],
        components: [
          { type: 'navbar', id: 'shop_nav', title: 'E-Shop Console', props: { links: [{ label: 'Store', href: '/shop' }] } },
          { type: 'table', id: 'prod_grid', title: 'Product Inventory', props: { api_endpoint: '/api/products', columns: ['id', 'name', 'price', 'stock_count'], _page_route: '/shop' } }
        ],
        state: {
          products: [
            { id: 101, name: 'Precision Gaming Mouse', price: 49, stock_count: 85 },
            { id: 102, name: 'RGB Mechanical Keyboard', price: 119, stock_count: 22 },
            { id: 103, name: 'Ultra-wide Curved Monitor', price: 349, stock_count: 8 }
          ]
        }
      }
    }
  },
  {
    id: 'chat-app',
    title: 'Instant Chat App',
    prompt: 'Build a private messaging app with contacts list, realtime chat messages screen, and status indications.',
    intent: { app_name: 'QuickChat', app_type: 'Communication', entities: ['Message', 'Channel', 'User'], features: ['Realtime messages'], roles: ['User'] },
    architecture: { database_design: { tables: ['messages', 'channels'] }, api_design: { endpoints: ['GET /api/messages'] }, ui_design: { pages: ['chat'] } },
    dbSchema: { tables: [{ table_name: 'messages', columns: [{ name: 'id', type: 'integer' }, { name: 'sender', type: 'text' }, { name: 'content', type: 'text' }, { name: 'channel_id', type: 'integer' }] }] },
    apiSchema: { apis: [{ path: '/api/messages', method: 'GET', auth_required: true, roles_allowed: ['User'] }] },
    uiSchema: { pages: [{ name: 'Chat', route: '/chat', components: [{ type: 'table', id: 'msg_list', props: { columns: ['id', 'sender', 'content'] } }] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/chat', page_name: 'Chat' }],
        components: [
          { type: 'sidebar', id: 'chat_side', title: 'Channels', props: { items: [{ label: '#general', route: '/chat' }, { label: '#dev-team', route: '/chat' }] } },
          { type: 'table', id: 'msg_list', title: 'Messages', props: { api_endpoint: '/api/messages', columns: ['id', 'sender', 'content'], _page_route: '/chat' } }
        ],
        state: {
          messages: [
            { id: 1, sender: 'Alice', content: 'Hey team, standup at 10am', channel_id: 1 },
            { id: 2, sender: 'Bob', content: 'Sounds good!', channel_id: 1 },
            { id: 3, sender: 'Charlie', content: 'PR #42 is ready for review', channel_id: 2 }
          ]
        }
      }
    }
  },
  {
    id: 'blog-platform',
    title: 'Blog Platform',
    prompt: 'Create a developer blogging platform with markdown posts, category tags, user comments, and email newsletter subscription.',
    intent: { app_name: 'DevBlog', app_type: 'CMS', entities: ['Post', 'Comment'], features: ['Newsletter'], roles: ['Author', 'Reader'] },
    architecture: { database_design: { tables: ['posts', 'comments'] }, api_design: { endpoints: ['GET /api/posts'] }, ui_design: { pages: ['blog'] } },
    dbSchema: { tables: [{ table_name: 'posts', columns: [{ name: 'id', type: 'integer' }, { name: 'title', type: 'text' }, { name: 'author', type: 'text' }, { name: 'category', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/posts', method: 'GET', auth_required: true, roles_allowed: ['Author', 'Reader'] }] },
    uiSchema: { pages: [{ name: 'Blog', route: '/blog', components: [{ type: 'table', id: 'posts_list', props: { columns: ['id', 'title', 'author'] } }] }] },
    validationReport: {
      valid: false,
      errors: ['API-Auth inconsistency: Endpoint GET /api/posts allows undefined role Reader.', 'Database Mismatch: Column category_id references missing table categories.']
    },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/blog', page_name: 'Blog Feed' }],
        components: [
          { type: 'navbar', id: 'blog_nav', title: 'DevBlog', props: { links: [{ label: 'Feed', href: '/blog' }] } },
          { type: 'table', id: 'posts_list', title: 'Published Articles', props: { api_endpoint: '/api/posts', columns: ['id', 'title', 'author', 'category'], _page_route: '/blog' } }
        ],
        state: {
          posts: [
            { id: 1, title: 'Understanding React Server Components', author: 'Jane Doe', category: 'Frontend' },
            { id: 2, title: 'Building Compiler Pipelines with Python', author: 'John Smith', category: 'Backend' },
            { id: 3, title: 'The Art of Database Normalization', author: 'Maria Garcia', category: 'Database' }
          ]
        }
      }
    }
  },
  {
    id: 'portfolio',
    title: 'Portfolio Builder',
    prompt: 'Build a designer portfolio website generator with customizable layout sections, project gallery showcase, and feedback forms.',
    intent: { app_name: 'Portfolio Builder', app_type: 'Site Builder', entities: ['Project', 'Message'], features: ['Gallery', 'Form'], roles: ['Designer', 'Client'] },
    architecture: { database_design: { tables: ['projects'] }, api_design: { endpoints: ['GET /api/projects'] }, ui_design: { pages: ['gallery'] } },
    dbSchema: { tables: [{ table_name: 'projects', columns: [{ name: 'id', type: 'integer' }, { name: 'title', type: 'text' }, { name: 'category', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/projects', method: 'GET', auth_required: false }] },
    uiSchema: { pages: [{ name: 'Gallery', route: '/gallery', components: [] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/gallery', page_name: 'Project Gallery' }],
        components: [
          { type: 'navbar', id: 'port_nav', title: 'Portfolio Builder', props: { links: [{ label: 'Gallery', href: '/gallery' }] } },
          { type: 'table', id: 'proj_grid', title: 'Showcase Projects', props: { api_endpoint: '/api/projects', columns: ['id', 'title', 'category'], _page_route: '/gallery' } }
        ],
        state: {
          projects: [
            { id: 1, title: 'Brand Redesign — Acme Corp', category: 'Branding' },
            { id: 2, title: 'Mobile App UI — FitTrack', category: 'UI/UX' },
            { id: 3, title: 'Dashboard Design — Analytics Pro', category: 'Web Design' }
          ]
        }
      }
    }
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    prompt: 'Build a traffic analytics portal with custom widget grids, metrics graphs, filter dropdowns, and CSV reports export.',
    intent: { app_name: 'Analytics Dashboard', app_type: 'Data Analytics', entities: ['Metric', 'Report'], features: ['Graphs', 'CSV Export'], roles: ['Analyst'] },
    architecture: { database_design: { tables: ['metrics'] }, api_design: { endpoints: ['GET /api/metrics'] }, ui_design: { pages: ['dashboard'] } },
    dbSchema: { tables: [{ table_name: 'metrics', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'text' }, { name: 'value', type: 'integer' }, { name: 'period', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/metrics', method: 'GET', auth_required: true, roles_allowed: ['Analyst'] }] },
    uiSchema: { pages: [{ name: 'Dashboard', route: '/dashboard', components: [] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/dashboard', page_name: 'Analytics Dashboard' }],
        components: [
          { type: 'stat_card', id: 'stat_visitors', title: 'Stat', props: { label: 'Total Visitors', value: '12,450', _page_route: '/dashboard' } },
          { type: 'stat_card', id: 'stat_bounce', title: 'Stat', props: { label: 'Bounce Rate', value: '34.2%', _page_route: '/dashboard' } },
          { type: 'stat_card', id: 'stat_conv', title: 'Stat', props: { label: 'Conversions', value: '1,280', _page_route: '/dashboard' } },
          { type: 'chart', id: 'traffic_chart', title: 'Weekly Traffic', props: { _page_route: '/dashboard' } },
          { type: 'table', id: 'metrics_table', title: 'Metrics Log', props: { api_endpoint: '/api/metrics', columns: ['id', 'name', 'value', 'period'], _page_route: '/dashboard' } }
        ],
        state: {
          metrics: [
            { id: 1, name: 'Page Views', value: 45200, period: 'Last 30 Days' },
            { id: 2, name: 'Unique Visitors', value: 12450, period: 'Last 30 Days' },
            { id: 3, name: 'Avg Session Duration', value: 245, period: 'Last 7 Days' }
          ]
        }
      }
    }
  },
  {
    id: 'fitness-tracker',
    title: 'Fitness Tracker',
    prompt: 'Build a fitness tracker application with workout routines planner, calorie intake logs, and goal targets progress indicators.',
    intent: { app_name: 'FitTrack', app_type: 'Health & Fitness', entities: ['Workout', 'Log'], features: ['Routine planner'], roles: ['Trainer', 'Athlete'] },
    architecture: { database_design: { tables: ['workouts'] }, api_design: { endpoints: ['GET /api/workouts'] }, ui_design: { pages: ['routines'] } },
    dbSchema: { tables: [{ table_name: 'workouts', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'text' }, { name: 'duration_min', type: 'integer' }, { name: 'calories', type: 'integer' }] }] },
    apiSchema: { apis: [{ path: '/api/workouts', method: 'GET', auth_required: true, roles_allowed: ['Trainer', 'Athlete'] }] },
    uiSchema: { pages: [{ name: 'Routines', route: '/routines', components: [] }] },
    validationReport: {
      valid: false,
      errors: ['UI Mismatch: Component workout_selector references missing api GET /api/workouts.']
    },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/routines', page_name: 'Workout Routines' }],
        components: [
          { type: 'sidebar', id: 'fit_side', title: 'FitTrack', props: { items: [{ label: 'Routines', route: '/routines' }] } },
          { type: 'table', id: 'workout_table', title: 'Workout Log', props: { api_endpoint: '/api/workouts', columns: ['id', 'name', 'duration_min', 'calories'], _page_route: '/routines' } }
        ],
        state: {
          workouts: [
            { id: 1, name: 'Morning Cardio', duration_min: 30, calories: 320 },
            { id: 2, name: 'Upper Body Strength', duration_min: 45, calories: 410 },
            { id: 3, name: 'HIIT Circuit', duration_min: 20, calories: 280 }
          ]
        }
      }
    }
  },
  {
    id: 'recipe-book',
    title: 'Recipe Book',
    prompt: 'Create a social recipe sharing board with ingredients list calculator, instructions steps, and user favorites database.',
    intent: { app_name: 'RecipeHub', app_type: 'Social Content', entities: ['Recipe', 'Ingredient'], features: ['Instructions calculator'], roles: ['Chef', 'User'] },
    architecture: { database_design: { tables: ['recipes'] }, api_design: { endpoints: ['GET /api/recipes'] }, ui_design: { pages: ['recipes'] } },
    dbSchema: { tables: [{ table_name: 'recipes', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'text' }, { name: 'cuisine', type: 'text' }, { name: 'prep_time', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/recipes', method: 'GET', auth_required: false }] },
    uiSchema: { pages: [{ name: 'Recipes', route: '/recipes', components: [] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/recipes', page_name: 'Recipe Collection' }],
        components: [
          { type: 'navbar', id: 'recipe_nav', title: 'RecipeHub', props: { links: [{ label: 'Recipes', href: '/recipes' }] } },
          { type: 'table', id: 'recipe_table', title: 'All Recipes', props: { api_endpoint: '/api/recipes', columns: ['id', 'name', 'cuisine', 'prep_time'], _page_route: '/recipes' } }
        ],
        state: {
          recipes: [
            { id: 1, name: 'Spaghetti Carbonara', cuisine: 'Italian', prep_time: '25 min' },
            { id: 2, name: 'Chicken Tikka Masala', cuisine: 'Indian', prep_time: '40 min' },
            { id: 3, name: 'Caesar Salad', cuisine: 'American', prep_time: '15 min' }
          ]
        }
      }
    }
  },
  {
    id: 'weather-portal',
    title: 'Weather Portal',
    prompt: 'Create a regional weather forecasting dashboard with current temp readings, weekly forecast charts, and city query inputs.',
    intent: { app_name: 'WeatherWise', app_type: 'Utility', entities: ['City', 'Forecast'], features: ['Forecasting'], roles: ['User'] },
    architecture: { database_design: { tables: ['cities'] }, api_design: { endpoints: ['GET /api/cities'] }, ui_design: { pages: ['forecast'] } },
    dbSchema: { tables: [{ table_name: 'cities', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'text' }, { name: 'temp_c', type: 'integer' }, { name: 'condition', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/cities', method: 'GET', auth_required: false }] },
    uiSchema: { pages: [{ name: 'Forecast', route: '/forecast', components: [] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/forecast', page_name: 'Weather Forecast' }],
        components: [
          { type: 'stat_card', id: 'temp_ny', title: 'Stat', props: { label: 'New York', value: '24°C ☀️', _page_route: '/forecast' } },
          { type: 'stat_card', id: 'temp_ld', title: 'Stat', props: { label: 'London', value: '16°C 🌧️', _page_route: '/forecast' } },
          { type: 'stat_card', id: 'temp_tk', title: 'Stat', props: { label: 'Tokyo', value: '28°C ⛅', _page_route: '/forecast' } },
          { type: 'chart', id: 'forecast_chart', title: 'Weekly Temperature Trend', props: { _page_route: '/forecast' } },
          { type: 'table', id: 'cities_table', title: 'City Conditions', props: { api_endpoint: '/api/cities', columns: ['id', 'name', 'temp_c', 'condition'], _page_route: '/forecast' } }
        ],
        state: {
          cities: [
            { id: 1, name: 'New York', temp_c: 24, condition: 'Sunny' },
            { id: 2, name: 'London', temp_c: 16, condition: 'Rainy' },
            { id: 3, name: 'Tokyo', temp_c: 28, condition: 'Partly Cloudy' }
          ]
        }
      }
    }
  },
  {
    id: 'notes-sync',
    title: 'Notes Sync',
    prompt: 'Create a note-taking application with folder organization, simple formatting edits, and automatic database save states.',
    intent: { app_name: 'NoteSync', app_type: 'Utility', entities: ['Note', 'Folder'], features: ['Folder organization'], roles: ['User'] },
    architecture: { database_design: { tables: ['notes'] }, api_design: { endpoints: ['GET /api/notes'] }, ui_design: { pages: ['notes'] } },
    dbSchema: { tables: [{ table_name: 'notes', columns: [{ name: 'id', type: 'integer' }, { name: 'title', type: 'text' }, { name: 'folder', type: 'text' }, { name: 'updated_at', type: 'text' }] }] },
    apiSchema: { apis: [{ path: '/api/notes', method: 'GET', auth_required: false }] },
    uiSchema: { pages: [{ name: 'Notes', route: '/notes', components: [] }] },
    validationReport: { valid: true, errors: [] },
    repairLogs: { repair_count: 0, issues_fixed: [] },
    runtimePreview: {
      runtime: {
        routes: [{ path: '/notes', page_name: 'My Notes' }],
        components: [
          { type: 'sidebar', id: 'notes_side', title: 'Folders', props: { items: [{ label: '📁 Work', route: '/notes' }, { label: '📁 Personal', route: '/notes' }, { label: '📁 Archive', route: '/notes' }] } },
          { type: 'form', id: 'note_form', title: 'New Note', props: { api_endpoint: '/api/notes', fields: [{ name: 'title', label: 'Note Title' }, { name: 'folder', label: 'Folder' }] } },
          { type: 'table', id: 'notes_table', title: 'All Notes', props: { api_endpoint: '/api/notes', columns: ['id', 'title', 'folder', 'updated_at'], _page_route: '/notes' } }
        ],
        state: {
          notes: [
            { id: 1, title: 'Meeting Notes — Sprint Review', folder: 'Work', updated_at: '2025-01-15' },
            { id: 2, title: 'Shopping List', folder: 'Personal', updated_at: '2025-01-14' },
            { id: 3, title: 'API Design Ideas', folder: 'Work', updated_at: '2025-01-13' }
          ]
        }
      }
    }
  }
];

function ProjectsPage({ projects = [] }) {
  const displayProjects = projects.length > 0 ? projects : MOCK_PROJECTS;
  const [selectedProj, setSelectedProj] = useState(displayProjects[0]);
  const [selectedNode, setSelectedNode] = useState('prompt');

  useEffect(() => {
    if (projects.length > 0) {
      // If a new project is compiled, highlight it
      setSelectedProj(projects[projects.length - 1]);
    }
  }, [projects]);

  // Dynamic statistics calculation
  const totalProjects = displayProjects.length;
  const successfulBuilds = displayProjects.filter(p => !p.validationReport || p.validationReport.valid).length;
  const validationFailures = displayProjects.filter(p => p.validationReport && !p.validationReport.valid).length; // Base offset of historical failures
  const repairsApplied = displayProjects.reduce((sum, p) => sum + (p.repairLogs && p.repairLogs.repair_count ? p.repairLogs.repair_count : 0), 0);
  const successRate = totalProjects > 0 ? Math.round((successfulBuilds / totalProjects) * 100) : 91;

  const STATS_LIST = [
    { label: 'Total Projects', value: String(totalProjects), icon: Folder, color: 'var(--accent-purple)' },
    { label: 'Successful Builds', value: String(successfulBuilds), icon: CheckCircle, color: 'var(--accent-emerald)' },
    { label: 'Validation Failures', value: String(validationFailures), icon: AlertTriangle, color: 'var(--accent-coral)' },
    { label: 'Repairs Applied', value: String(repairsApplied), icon: Wrench, color: 'var(--accent-orange)' },
    { label: 'Avg Generation Time', value: '3.8 s', icon: Clock, color: 'var(--accent-cyan)' },
    { label: 'Success Rate', value: `${successRate}%`, icon: Percent, color: 'var(--accent-blue)' }
  ];

  return (
    <div className="projects-view-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', padding: '1.5rem', gap: '1.5rem' }}>

      {/* 1. Global Stats Section */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {STATS_LIST.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="stat-card"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ background: `${stat.color}15`, color: stat.color, padding: '0.6rem', borderRadius: '12px' }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Projects Explorer Grid */}
      <div className="explorer-layout" style={{ display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden', minHeight: 0 }}>

        {/* Left Side: Projects List */}
        <div className="projects-list-pane" style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-color)' }}>
            Generated Projects
          </h4>
          {displayProjects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => { setSelectedProj(proj); setSelectedNode('prompt'); }}
              style={{
                background: selectedProj.id === proj.id ? 'var(--accent-purple)' : 'var(--card-bg)',
                color: selectedProj.id === proj.id ? '#ffffff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{proj.title}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {proj.prompt}
              </span>
            </button>
          ))}
        </div>

        {/* Right Side: Selected Project Details & Code Tree */}
        <div className="project-details-pane" style={{ flex: 1, display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0, 0, 0, 0.02)' }}>

          {/* Tree Navigation Menu */}
          <div className="details-tree-menu" style={{ width: '220px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '4px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>
              Project Artifacts
            </span>

            <button
              onClick={() => setSelectedNode('prompt')}
              style={{
                background: selectedNode === 'prompt' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'prompt' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'prompt' ? '600' : '500'
              }}
            >
              <FileText size={14} /> Original Prompt
            </button>

            <button
              onClick={() => setSelectedNode('intent')}
              style={{
                background: selectedNode === 'intent' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'intent' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'intent' ? '600' : '500'
              }}
            >
              <ShieldCheck size={14} /> Intent Output
            </button>

            <button
              onClick={() => setSelectedNode('architecture')}
              style={{
                background: selectedNode === 'architecture' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'architecture' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'architecture' ? '600' : '500'
              }}
            >
              <Layout size={14} /> Architecture
            </button>

            <button
              onClick={() => setSelectedNode('dbSchema')}
              style={{
                background: selectedNode === 'dbSchema' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'dbSchema' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'dbSchema' ? '600' : '500'
              }}
            >
              <Database size={14} /> DB Schema
            </button>

            <button
              onClick={() => setSelectedNode('apiSchema')}
              style={{
                background: selectedNode === 'apiSchema' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'apiSchema' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'apiSchema' ? '600' : '500'
              }}
            >
              <Terminal size={14} /> API Schema
            </button>

            <button
              onClick={() => setSelectedNode('uiSchema')}
              style={{
                background: selectedNode === 'uiSchema' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'uiSchema' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'uiSchema' ? '600' : '500'
              }}
            >
              <Layout size={14} /> UI Schema
            </button>

            <button
              onClick={() => setSelectedNode('validationReport')}
              style={{
                background: selectedNode === 'validationReport' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'validationReport' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'validationReport' ? '600' : '500'
              }}
            >
              <ShieldCheck size={14} /> Validation Report
            </button>

            <button
              onClick={() => setSelectedNode('repairLogs')}
              style={{
                background: selectedNode === 'repairLogs' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'repairLogs' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'repairLogs' ? '600' : '500'
              }}
            >
              <HeartPulse size={14} /> Repair Logs
            </button>

            <button
              onClick={() => setSelectedNode('runtimePreview')}
              style={{
                background: selectedNode === 'runtimePreview' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: selectedNode === 'runtimePreview' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: selectedNode === 'runtimePreview' ? '600' : '500'
              }}
            >
              <Play size={14} /> Runtime Preview
            </button>
          </div>

          {/* Details Content Display */}
          <div className="details-content-display" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {selectedProj.title} &gt; {selectedNode.charAt(0).toUpperCase() + selectedNode.slice(1).replace(/([A-Z])/g, ' $1')}
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {selectedNode === 'prompt' && (
                <div style={{ padding: '1.25rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
                  {selectedProj.prompt}
                </div>
              )}
              {selectedNode === 'runtimePreview' && (
                <div style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
                  <Sandbox compiledConfig={selectedProj.runtimePreview} isCompiling={false} setCompiledConfig={() => { }} />
                </div>
              )}

              {selectedNode !== 'prompt' && selectedNode !== 'runtimePreview' && (
                <pre style={{ margin: 0, padding: '1.25rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflowX: 'auto' }}>
                  <code style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: '#e2e8f0' }}>
                    {JSON.stringify(selectedProj[selectedNode], null, 2)}
                  </code>
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
