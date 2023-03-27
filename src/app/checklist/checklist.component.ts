import { CommonModule } from "@angular/common";
import { Component, inject, Signal, signal } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap, RouterModule } from "@angular/router";
import { fromObservable } from "../from-observable";
import { ChecklistService } from "../shared/data-access/checklist.service";
import { ChecklistItem } from "../shared/interfaces/checklist-item";
import { FormModalComponent } from "../shared/ui/form-modal.component";
import { ModalComponent } from "../shared/ui/modal.component";
import { ChecklistItemService } from "./data-access/checklist-item.service";
import { ChecklistItemHeaderComponent } from "./ui/checklist-item-header.component";
import { ChecklistItemListComponent } from "./ui/checklist-item-list.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ChecklistItemHeaderComponent,
    ChecklistItemListComponent,
    ModalComponent,
    FormModalComponent,
    RouterModule,
  ],
  selector: "app-checklist",
  template: `
    <nav>
      <a routerLink="/">Back</a>
    </nav>
    <app-checklist-item-header
      [checklist]="checklist()"
      (addItem)="formModalIsOpen.set(true)"
      (resetChecklist)="resetChecklistItems($event)"
    />

    <app-checklist-item-list
      [checklistItems]="items()"
      (toggle)="toggleChecklistItem($event)"
      (delete)="deleteChecklistItem($event)"
      (edit)="openEditModal($event)"
    />

    <app-modal [isOpen]="formModalIsOpen()">
      <ng-template>
        <app-form-modal
          [title]="checklistItemIdBeingEdited() ? 'Edit Item' : 'Create item'"
          [formGroup]="checklistItemForm"
          (close)="dismissModal()"
          (save)="
            checklistItemIdBeingEdited()
              ? editChecklistItem(checklistItemIdBeingEdited()!)
              : addChecklistItem(checklist().id)
          "
        ></app-form-modal>
      </ng-template>
    </app-modal>
  `,
})
export default class ChecklistComponent {
  checklistItemForm;
  items: Signal<ChecklistItem[]>;

  formModalIsOpen = signal(false);
  checklistItemIdBeingEdited = signal<string | null>(null);

  params: Signal<ParamMap> = fromObservable(inject(ActivatedRoute).paramMap);

  checklist = inject(ChecklistService).getChecklistById(
    this.params().get("id")
  );

  constructor(
    fb: FormBuilder,
    private checklistItemService: ChecklistItemService
  ) {
    this.items = checklistItemService.getItemsByChecklistId(
      this.params().get("id")
    );
    this.checklistItemForm = fb.nonNullable.group({
      title: ["", Validators.required],
    });
  }

  dismissModal() {
    this.formModalIsOpen.set(false);
    this.checklistItemIdBeingEdited.set(null);
  }

  addChecklistItem(checklistId: string) {
    this.checklistItemService.add(
      this.checklistItemForm.getRawValue(),
      checklistId
    );
  }

  editChecklistItem(checklistItemId: string) {
    this.checklistItemService.update(
      checklistItemId,
      this.checklistItemForm.getRawValue()
    );
  }

  openEditModal(checklistItem: ChecklistItem) {
    this.checklistItemForm.patchValue({
      title: checklistItem.title,
    });
    this.checklistItemIdBeingEdited.set(checklistItem.id);
    this.formModalIsOpen.set(true);
  }

  toggleChecklistItem(itemId: string) {
    this.checklistItemService.toggle(itemId);
  }

  resetChecklistItems(checklistId: string) {
    this.checklistItemService.reset(checklistId);
  }

  deleteChecklistItem(id: string) {
    this.checklistItemService.remove(id);
  }
}
