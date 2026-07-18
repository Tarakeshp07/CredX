import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { Toast } from '../../core/models';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.type }} animate-slide-in-right"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
        >
          <!-- Icon -->
          <div class="toast__icon">
            @switch (toast.type) {
              @case ('success') {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('error') {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('warning') {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
                </svg>
              }
              @default {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd"/>
                </svg>
              }
            }
          </div>

          <!-- Message -->
          <p class="toast__message">{{ toast.message }}</p>

          <!-- Dismiss -->
          <button
            class="toast__close"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
            </svg>
          </button>

          <!-- Auto-dismiss progress bar -->
          @if (toast.duration && toast.duration > 0) {
            <div
              class="toast__progress"
              [style.animation-duration]="toast.duration + 'ms'"
            ></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: relative;
      overflow: hidden;
      pointer-events: all;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
    }

    /* Type variants */
    .toast--success {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(22, 163, 74, 0.3);
    }

    .toast--success .toast__icon { color: #15803d; background: rgba(22, 163, 74, 0.1); }
    .toast--success .toast__progress { background: linear-gradient(90deg, #16a34a, #22c55e); }

    .toast--error {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(244, 63, 94, 0.3);
    }

    .toast--error .toast__icon { color: #e11d48; background: rgba(244, 63, 94, 0.1); }
    .toast--error .toast__progress { background: linear-gradient(90deg, #e11d48, #f43f5e); }

    .toast--warning {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(217, 119, 6, 0.3);
    }

    .toast--warning .toast__icon { color: #b45309; background: rgba(217, 119, 6, 0.1); }
    .toast--warning .toast__progress { background: linear-gradient(90deg, #d97706, #f59e0b); }

    .toast--info {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .toast--info .toast__icon { color: #4f46e5; background: rgba(99, 102, 241, 0.1); }
    .toast--info .toast__progress { background: linear-gradient(90deg, #4f46e5, #6366f1); }

    .toast__icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast__icon svg {
      width: 16px;
      height: 16px;
    }

    .toast__message {
      flex: 1;
      font-size: 0.875rem;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding-top: 6px;
    }

    .toast__close {
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .toast__close:hover { color: #0f172a; }

    /* Progress bar — shrinks from 100% → 0% over duration */
    .toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      animation: toast-progress linear forwards;
      transform-origin: left;
    }

    @keyframes toast-progress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* Slide-in animation */
    @keyframes slide-in-right {
      from {
        opacity: 0;
        transform: translateX(40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @media (max-width: 480px) {
      .toast-container {
        bottom: 16px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  `]
})
export class ToastComponent {
  toasts = computed(() => this.toastService.toasts());

  constructor(private toastService: ToastService) {}

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
