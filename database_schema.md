# Schéma de la Base de Données (UML)

Ce diagramme illustre l'architecture de la base de données de l'application HRMS. Le système utilise une approche **multi-tenant**, où chaque donnée est rattachée à une `Organization`.

```mermaid
classDiagram
    class User {
        +id: int
        +username: string
        +email: string
        +first_name: string
        +last_name: string
    }

    class Organization {
        +id: int
        +name: string
        +slug: string
        +plan: string
        +max_employees: int
    }

    class OrganizationMember {
        +id: int
        +role: enum
        +is_active: bool
    }

    class Employee {
        +id: int
        +employee_id: string
        +position: string
        +salary: decimal
        +status: enum
    }

    class Department {
        +id: int
        +name: string
        +code: string
    }

    class LeaveType {
        +id: int
        +name: string
        +code: string
        +is_paid: bool
    }

    class LeaveRequest {
        +id: int
        +start_date: date
        +end_date: date
        +status: enum
        +reason: text
    }

    class Attendance {
        +id: int
        +date: date
        +check_in: time
        +check_out: time
        +status: enum
    }

    class Document {
        +id: int
        +title: string
        +category: enum
        +file: string
    }

    class Payroll {
        +id: int
        +month: int
        +year: int
        +net_salary: decimal
    }

    %% Relations
    Organization "1" -- "*" OrganizationMember : has
    User "1" -- "*" OrganizationMember : member of
    User "1" -- "0..1" Employee : linked to
    
    Organization "1" -- "*" Employee : has
    Organization "1" -- "*" Department : has
    
    Department "1" -- "*" Employee : works in
    Department "0..1" -- "0..1" Employee : managed by
    Department "0..1" -- "*" Department : sub-departments
    
    Employee "0..1" -- "*" Employee : manages
    
    Organization "1" -- "*" LeaveType : defines
    Organization "1" -- "*" LeaveRequest : owns
    Employee "1" -- "*" LeaveRequest : requests
    LeaveType "1" -- "*" LeaveRequest : type
    Employee "0..1" -- "*" LeaveRequest : approved by
    
    Organization "1" -- "*" Attendance : tracks
    Employee "1" -- "*" Attendance : records
    
    Organization "1" -- "*" Document : owns
    Employee "1" -- "*" Document : belongs to
    User "1" -- "*" Document : uploaded by
    
    Organization "1" -- "*" Payroll : issue
    Employee "1" -- "*" Payroll : receives
```

## Points Clés de l'Architecture

1. **Multi-Tenancy** : Presque tous les modèles sont liés à `Organization` via une clé étrangère. Cela permet d'isoler les données de chaque entreprise.
2. **Double Identité** : Un utilisateur Django (`User`) est séparé de la fiche employée (`Employee`). Cela permet à une personne d'exister dans le système sans être forcément un employé (ex: un consultant externe ou un propriétaire n'ayant pas de fiche de paie).
3. **Hiérarchie** : Les employés peuvent avoir un manager (auto-relation sur `Employee`), et les départements peuvent avoir des sous-départements (auto-relation sur `Department`).
4. **Gestion des Droits** : La table `OrganizationMember` définit les droits d'accès au sein d'une organisation spécifique.
