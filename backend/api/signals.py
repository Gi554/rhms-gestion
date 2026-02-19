from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LeaveRequest, Payroll, Document, Notification, Employee

@receiver(post_save, sender=LeaveRequest)
def leave_request_notification(sender, instance, created, **kwargs):
    if created:
        # Notification pour le manager
        manager = instance.employee.manager
        if manager and manager.user:
            Notification.objects.create(
                recipient=manager.user,
                sender=instance.employee.user,
                type=Notification.TYPE_LEAVE,
                title="Nouvelle demande de congé",
                message=f"{instance.employee.full_name} a soumis une demande de congé ({instance.leave_type.name}).",
                link="/leaves"
            )
    else:
        # Notification pour l'employé (approbation/rejet)
        if instance.status in [LeaveRequest.STATUS_APPROVED, LeaveRequest.STATUS_REJECTED]:
            status_label = "approuvée" if instance.status == LeaveRequest.STATUS_APPROVED else "rejetée"
            Notification.objects.create(
                recipient=instance.employee.user,
                sender=instance.approved_by.user if instance.approved_by else None,
                type=Notification.TYPE_LEAVE,
                title=f"Demande de congé {status_label}",
                message=f"Votre demande de congé du {instance.start_date} au {instance.end_date} a été {status_label}.",
                link="/leaves"
            )

@receiver(post_save, sender=Payroll)
def payroll_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            recipient=instance.employee.user,
            type=Notification.TYPE_PAYROLL,
            title="Nouveau bulletin de paie",
            message=f"Votre bulletin de paie pour la période de {instance.period_start} à {instance.period_end} est disponible.",
            link="/payroll"
        )

@receiver(post_save, sender=Document)
def document_notification(sender, instance, created, **kwargs):
    if created and instance.employee:
        Notification.objects.create(
            recipient=instance.employee.user,
            type=Notification.TYPE_DOCUMENT,
            title="Nouveau document disponible",
            message=f"Un nouveau document '{instance.title}' a été ajouté à votre dossier.",
            link="/documents"
        )
