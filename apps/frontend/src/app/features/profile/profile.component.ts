import {
  Component,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfileService, ProfileDto, SkillDto } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

const WORK_AUTH_OPTIONS = [
  { value: 'CITIZEN',            label: '🇮🇳 Citizen / National' },
  { value: 'PERMANENT_RESIDENT', label: '🟢 Permanent Resident' },
  { value: 'STUDENT_VISA',       label: '🎓 Student Visa' },
  { value: 'NEEDS_SPONSORSHIP',  label: '🌍 Needs Visa Sponsorship' },
  { value: 'UNKNOWN',            label: '— Prefer not to say' },
];

const ROLE_TYPE_OPTIONS = [
  'Frontend', 'Backend', 'Full-Stack', 'Data', 'AI', 'DevOps', 'Cloud', 'Mobile', 'Other'
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="profile-page">

      <!-- Background accents -->
      <div class="profile-bg-glow profile-bg-glow--tl"></div>
      <div class="profile-bg-glow profile-bg-glow--br"></div>

      <div class="page-container">

        <!-- Page Header -->
        <div class="profile-header animate-fade-in-up">
          <div class="profile-header__left">
            <div class="profile-avatar">
              {{ avatarInitial() }}
            </div>
            <div>
              <h1 class="profile-header__name">
                {{ profileName() || 'My Profile' }}
              </h1>
              <p class="profile-header__email">{{ currentUser()?.email }}</p>
            </div>
          </div>

          <!-- Completion Badge -->
          <div
            class="profile-completion"
            [class.profile-completion--done]="profile()?.profileCompleted"
          >
            @if (profile()?.profileCompleted) {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
              </svg>
              Profile Complete
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;">
                <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
              </svg>
              Incomplete — Add GPA, skills & work auth
            }
          </div>
        </div>

        @if (pageLoading()) {
          <!-- Skeleton -->
          <div class="profile-skeleton animate-fade-in">
            @for (i of [1,2,3]; track i) {
              <div class="glass profile-section" style="padding:32px;">
                <div class="skeleton" style="width:140px;height:20px;margin-bottom:24px;"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                  @for (j of [1,2,3,4]; track j) {
                    <div>
                      <div class="skeleton" style="width:80px;height:12px;margin-bottom:8px;"></div>
                      <div class="skeleton" style="height:44px;border-radius:10px;"></div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {

          <form [formGroup]="form" (ngSubmit)="onSave()" class="profile-form animate-fade-in-up" style="animation-delay:0.1s">

            <!-- ── Section 1: Personal Info ────────────────────────────────── -->
            <section class="glass profile-section">
              <div class="profile-section__head">
                <div class="profile-section__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z"/>
                  </svg>
                </div>
                <h2 class="profile-section__title">Personal Information</h2>
              </div>

              <div class="profile-grid">
                <div class="form-group">
                  <label class="form-label" for="p-first">First name</label>
                  <input id="p-first" type="text" formControlName="firstName"
                    class="form-input" [class.error]="isInvalid('firstName')"
                    placeholder="John" autocomplete="given-name"/>
                  @if (isInvalid('firstName')) {
                    <p class="field-error">First name is required.</p>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="p-last">Last name</label>
                  <input id="p-last" type="text" formControlName="lastName"
                    class="form-input" [class.error]="isInvalid('lastName')"
                    placeholder="Doe" autocomplete="family-name"/>
                  @if (isInvalid('lastName')) {
                    <p class="field-error">Last name is required.</p>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="p-phone">Phone number <span class="optional">(optional)</span></label>
                  <input id="p-phone" type="tel" formControlName="phone"
                    class="form-input" placeholder="+91 98765 43210" autocomplete="tel"/>
                </div>

                <div class="form-group">
                  <label class="form-label" for="p-location">Preferred location <span class="optional">(optional)</span></label>
                  <input id="p-location" type="text" formControlName="preferredLocation"
                    class="form-input" placeholder="Remote, Bengaluru, Mumbai…"/>
                </div>
              </div>
            </section>

            <!-- ── Section 2: Academic & Career ───────────────────────────── -->
            <section class="glass profile-section">
              <div class="profile-section__head">
                <div class="profile-section__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L5.25 8.051a.999.999 0 0 1 .356-.357l4-2.5a1 1 0 1 1 1.04 1.732l-3.23 2.02.002.013a15.001 15.001 0 0 1 3.333.517l5.655-2.422a1 1 0 0 0 0-1.84l-7-3ZM5.25 10.855a15 15 0 0 1-2.08-.867A1 1 0 0 0 2 11v5a1 1 0 0 0 .682.948l7 2.5a.999.999 0 0 0 .636 0l7-2.5A1 1 0 0 0 18 16v-5a1 1 0 0 0-1.17-.982 15 15 0 0 1-2.08.867A15.12 15.12 0 0 1 10 12c-1.714 0-3.37-.276-4.75-.855Z"/>
                  </svg>
                </div>
                <h2 class="profile-section__title">Academic & Career</h2>
              </div>

              <div class="profile-grid">

                <!-- GPA -->
                <div class="form-group">
                  <label class="form-label" for="p-gpa">
                    GPA
                    <span class="optional">/ 10.0</span>
                  </label>
                  <div class="input-with-badge">
                    <input id="p-gpa" type="number" formControlName="gpa"
                      class="form-input" [class.error]="isInvalid('gpa')"
                      min="0" max="10" step="0.1" placeholder="7.5"/>
                    @if (gpaValue()) {
                      <span class="input-badge" [style.background]="gpaColor()">
                        {{ gpaLabel() }}
                      </span>
                    }
                  </div>
                  @if (isInvalid('gpa')) {
                    <p class="field-error">GPA must be between 0.0 and 10.0.</p>
                  }
                </div>

                <!-- Experience Years -->
                <div class="form-group">
                  <label class="form-label" for="p-exp">Years of experience</label>
                  <div class="stepper">
                    <button type="button" class="stepper__btn" (click)="stepExp(-1)"
                      [disabled]="(form.get('experienceYears')?.value ?? 0) <= 0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;"><path fill-rule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd"/></svg>
                    </button>
                    <input id="p-exp" type="number" formControlName="experienceYears"
                      class="form-input stepper__input" min="0" max="50" readonly/>
                    <button type="button" class="stepper__btn" (click)="stepExp(1)"
                      [disabled]="(form.get('experienceYears')?.value ?? 0) >= 50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;"><path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H3.75a.75.75 0 0 1 0-1.5h5.5V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd"/></svg>
                    </button>
                  </div>
                  <p class="field-hint">{{ expLabel() }}</p>
                </div>

                <!-- Work Auth Status -->
                <div class="form-group form-group--full">
                  <label class="form-label">Work authorization status</label>
                  <div class="work-auth-grid">
                    @for (opt of workAuthOptions; track opt.value) {
                      <button
                        type="button"
                        class="work-auth-btn"
                        [class.work-auth-btn--active]="form.get('workAuthStatus')?.value === opt.value"
                        (click)="form.get('workAuthStatus')?.setValue(opt.value)"
                        [id]="'auth-' + opt.value"
                      >
                        {{ opt.label }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Desired Role -->
                <div class="form-group">
                  <label class="form-label" for="p-role">Desired role type</label>
                  <select id="p-role" formControlName="desiredRole" class="form-input form-select">
                    <option value="">— Any role —</option>
                    @for (r of roleTypes; track r) {
                      <option [value]="r">{{ r }}</option>
                    }
                  </select>
                </div>

                <!-- Open to Remote -->
                <div class="form-group" style="display:flex;align-items:center;gap:0;">
                  <div class="toggle-row">
                    <div>
                      <p class="form-label" style="margin-bottom:2px;">Open to remote work</p>
                      <p class="field-hint" style="margin:0;">Affects job matching remote filter</p>
                    </div>
                    <button
                      type="button"
                      class="toggle"
                      [class.toggle--on]="form.get('openToRemote')?.value"
                      (click)="toggleRemote()"
                      id="toggle-remote"
                      role="switch"
                      [attr.aria-checked]="form.get('openToRemote')?.value"
                    >
                      <span class="toggle__thumb"></span>
                    </button>
                  </div>
                </div>

              </div>
            </section>

            <!-- ── Section 3: Skills ───────────────────────────────────────── -->
            <section class="glass profile-section">
              <div class="profile-section__head">
                <div class="profile-section__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path fill-rule="evenodd" d="M9.664 1.319a.75.75 0 0 1 .672 0 41.059 41.059 0 0 1 8.198 5.424.75.75 0 0 1-.254 1.285 31.372 31.372 0 0 0-7.86 3.83.75.75 0 0 1-.84 0 31.508 31.508 0 0 0-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 0 1 3.305-2.033.75.75 0 0 0-.714-1.319 37 37 0 0 0-3.446 2.12A2.216 2.216 0 0 0 6 9.393v.38a31.293 31.293 0 0 0-4.28-1.746.75.75 0 0 1-.254-1.285 41.059 41.059 0 0 1 8.198-5.424ZM6 11.459a29.848 29.848 0 0 0-2.455-1.158 41.029 41.029 0 0 0-.39 3.114.75.75 0 0 0 .419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 1 0 1.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 0 1 3.095 2.348.75.75 0 0 0 .992 0 26.547 26.547 0 0 1 5.93-3.95.75.75 0 0 0 .42-.739 41.053 41.053 0 0 0-.39-3.114 29.925 29.925 0 0 0-5.199 2.801 2.25 2.25 0 0 1-2.514 0c-.41-.275-.826-.541-1.25-.797Z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h2 class="profile-section__title">Skills</h2>
                  <p class="profile-section__sub">
                    {{ selectedSkills().length }} selected — affects your Match Score (60% weight)
                  </p>
                </div>
              </div>

              <!-- Search -->
              <div class="skill-search-wrap">
                <svg class="skill-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/>
                </svg>
                <input
                  type="text"
                  class="form-input skill-search"
                  placeholder="Search skills… (JavaScript, Python, Docker…)"
                  [value]="skillSearch()"
                  (input)="onSkillSearch($event)"
                  id="skill-search"
                  autocomplete="off"
                />
                @if (skillSearch()) {
                  <button type="button" class="skill-search-clear" (click)="clearSkillSearch()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                    </svg>
                  </button>
                }
              </div>

              <!-- Selected Pills -->
              @if (selectedSkills().length > 0) {
                <div class="selected-skills">
                  <p class="selected-skills__label">Selected skills:</p>
                  <div class="selected-skills__pills">
                    @for (skill of selectedSkills(); track skill) {
                      <span class="skill-pill skill-pill--selected">
                        {{ skill }}
                        <button
                          type="button"
                          class="skill-pill__remove"
                          (click)="removeSkill(skill)"
                          [attr.aria-label]="'Remove ' + skill"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;">
                            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
                          </svg>
                        </button>
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- Skill Grid by Category -->
              @if (skillsLoading()) {
                <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:8px;">
                  @for (i of [1,2,3,4,5,6,7,8]; track i) {
                    <div class="skeleton" style="width:90px;height:32px;border-radius:20px;"></div>
                  }
                </div>
              } @else if (filteredSkillGroups().length === 0) {
                <div class="skills-empty">
                  <p>No skills match "{{ skillSearch() }}"</p>
                </div>
              } @else {
                <div class="skill-groups">
                  @for (group of filteredSkillGroups(); track group.category) {
                    <div class="skill-group">
                      <p class="skill-group__label">{{ group.category }}</p>
                      <div class="skill-group__pills">
                        @for (skill of group.skills; track skill.name) {
                          <button
                            type="button"
                            class="skill-pill"
                            [class.skill-pill--selected]="isSelected(skill.name)"
                            (click)="toggleSkill(skill.name)"
                            [attr.aria-pressed]="isSelected(skill.name)"
                          >
                            @if (isSelected(skill.name)) {
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;">
                                <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
                              </svg>
                            }
                            {{ skill.name }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- ── Save Bar ────────────────────────────────────────────────── -->
            <div class="profile-save-bar glass">

              @if (saveSuccess()) {
                <div class="save-success animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
                  </svg>
                  Profile saved successfully!
                </div>
              }

              @if (saveError()) {
                <div class="save-error animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
                  </svg>
                  {{ saveError() }}
                </div>
              }

              <div class="save-bar-actions">
                <p class="save-bar-hint">
                  @if (!profile()?.profileCompleted) {
                    Complete your profile to improve match scores
                  } @else {
                    Profile is complete ✓ — head to the dashboard
                  }
                </p>
                <div style="display:flex;gap:12px;align-items:center;">
                  <button
                    type="button"
                    class="btn-ghost"
                    (click)="goToDashboard()"
                  >
                    View Dashboard →
                  </button>
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="saving()"
                    id="save-profile-btn"
                  >
                    @if (saving()) {
                      <span class="auth-spinner"></span>
                      Saving…
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:17px;height:17px;">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>
                      </svg>
                      Save Profile
                    }
                  </button>
                </div>
              </div>
            </div>

          </form>

        }<!-- /else pageLoading -->

      </div>
    </div>
  `,
  styles: [`
    /* ── Page Layout ── */
    .profile-page {
      min-height: calc(100vh - 64px);
      padding: 40px 0 80px;
      position: relative;
      overflow-x: hidden;
    }

    .profile-bg-glow {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      z-index: 0;
    }

    .profile-bg-glow--tl {
      top: -200px;
      left: -200px;
      background: radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%);
    }

    .profile-bg-glow--br {
      bottom: -200px;
      right: -200px;
      background: radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%);
    }

    .page-container { position: relative; z-index: 1; }

    /* ── Header ── */
    .profile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 32px;
    }

    .profile-header__left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c6ff7, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 0 24px rgba(124,111,247,0.35);
    }

    .profile-header__name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }

    .profile-header__email {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .profile-completion {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.25);
      color: #e11d48;
    }

    .profile-completion--done {
      background: rgba(22, 163, 74, 0.08);
      border-color: rgba(22, 163, 74, 0.25);
      color: #15803d;
    }

    /* ── Form ── */
    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .profile-section {
      padding: 28px 32px;
    }

    .profile-section__head {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 24px;
    }

    .profile-section__icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(99,102,241,0.1);
      border: 1px solid rgba(99,102,241,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4f46e5;
      flex-shrink: 0;
    }

    .profile-section__title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px;
      letter-spacing: -0.01em;
    }

    .profile-section__sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group--full {
      grid-column: 1 / -1;
    }

    .optional {
      font-size: 0.75rem;
      color: #475569;
      font-weight: 400;
    }

    .field-error {
      font-size: 0.75rem;
      color: #e11d48;
      margin: 0;
    }

    .field-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin: 2px 0 0;
    }

    /* GPA input with badge */
    .input-with-badge {
      position: relative;
    }

    .input-badge {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      color: #fff;
    }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--color-surface-600);
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }

    .stepper__btn {
      width: 44px;
      height: 44px;
      background: var(--color-surface-700);
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .stepper__btn:hover:not(:disabled) {
      background: rgba(99,102,241,0.12);
      color: #4f46e5;
    }

    .stepper__btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .stepper__input {
      flex: 1;
      text-align: center;
      border: none;
      border-radius: 0;
      border-left: 1px solid var(--color-surface-600);
      border-right: 1px solid var(--color-surface-600);
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      background: transparent;
      cursor: default;
    }

    /* Work Auth Grid */
    .work-auth-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }

    .work-auth-btn {
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid var(--color-surface-600);
      border-radius: 10px;
      color: #475569;
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .work-auth-btn:hover {
      border-color: rgba(99,102,241,0.4);
      color: #4f46e5;
      background: rgba(99,102,241,0.04);
    }

    .work-auth-btn--active {
      background: rgba(99,102,241,0.1);
      border-color: #6366f1;
      color: #4f46e5;
      font-weight: 600;
    }

    /* Form select */
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 20px;
      padding-right: 40px;
      cursor: pointer;
    }

    .form-select option {
      background: #ffffff;
      color: #0f172a;
    }

    /* Toggle */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
    }

    .toggle {
      position: relative;
      width: 48px;
      height: 26px;
      border-radius: 999px;
      background: var(--color-surface-500);
      border: 1px solid var(--color-surface-500);
      cursor: pointer;
      transition: all 0.25s ease;
      flex-shrink: 0;
    }

    .toggle--on {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-color: transparent;
      box-shadow: 0 2px 8px rgba(99,102,241,0.35);
    }

    .toggle__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.25s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .toggle--on .toggle__thumb {
      transform: translateX(22px);
    }

    /* ── Skill Picker ── */
    .skill-search-wrap {
      position: relative;
      margin-bottom: 16px;
    }

    .skill-search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 17px;
      height: 17px;
      color: #475569;
      pointer-events: none;
    }

    .skill-search {
      padding-left: 42px !important;
      padding-right: 40px !important;
    }

    .skill-search-clear {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .skill-search-clear:hover { color: #0f172a; }

    .selected-skills {
      margin-bottom: 16px;
    }

    .selected-skills__label {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0 0 8px;
      font-weight: 500;
    }

    .selected-skills__pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-groups {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .skill-group__label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #475569;
      margin: 0 0 8px;
    }

    .skill-group__pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--color-surface-600);
      background: #ffffff;
      color: #475569;
      transition: all 0.18s ease;
      font-family: var(--font-sans);
    }

    .skill-pill:hover {
      border-color: rgba(99,102,241,0.4);
      color: #4f46e5;
      background: rgba(99,102,241,0.05);
    }

    .skill-pill--selected {
      background: rgba(99,102,241,0.12);
      border-color: #6366f1;
      color: #4f46e5;
      font-weight: 600;
    }

    .skill-pill__remove {
      background: none;
      border: none;
      color: #4f46e5;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      opacity: 0.7;
      transition: opacity 0.2s;
      margin-left: 2px;
    }

    .skill-pill__remove:hover { opacity: 1; }

    .skills-empty {
      text-align: center;
      padding: 24px;
      color: #475569;
      font-size: 0.875rem;
    }

    /* ── Save Bar ── */
    .profile-save-bar {
      position: sticky;
      bottom: 20px;
      padding: 16px 24px;
      border-radius: 14px;
      border: 1px solid rgba(124,111,247,0.15);
    }

    .save-bar-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .save-bar-hint {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0;
    }

    .save-success {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(22,163,74,0.08);
      border: 1px solid rgba(22,163,74,0.25);
      border-radius: 8px;
      color: #15803d;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }

    .save-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(244,63,94,0.08);
      border: 1px solid rgba(244,63,94,0.2);
      border-radius: 8px;
      color: #e11d48;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }

    .auth-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .profile-grid { grid-template-columns: 1fr; }
      .profile-section { padding: 20px; }
      .work-auth-grid { grid-template-columns: 1fr 1fr; }
      .profile-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  // ── State ────────────────────────────────────────────────────────────────────
  profile      = signal<ProfileDto | null>(null);
  allSkills    = signal<SkillDto[]>([]);
  selectedSkills = signal<string[]>([]);
  skillSearch  = signal('');

  pageLoading  = signal(true);
  skillsLoading= signal(true);
  saving       = signal(false);
  saveSuccess  = signal(false);
  saveError    = signal('');

  form: FormGroup;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly workAuthOptions = WORK_AUTH_OPTIONS;
  readonly roleTypes       = ROLE_TYPE_OPTIONS;

  // ── Computed ──────────────────────────────────────────────────────────────
  currentUser = computed(() => this.auth.currentUser());

  avatarInitial = computed(() => {
    const u = this.auth.currentUser();
    return (u?.firstName?.charAt(0) ?? u?.email?.charAt(0) ?? 'U').toUpperCase();
  });

  profileName = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '';
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
  });

  gpaValue = computed(() => this.form?.get('gpa')?.value ?? null);

  gpaLabel = computed(() => {
    const v = this.gpaValue();
    if (v === null || v === '' || isNaN(Number(v))) return '';
    const n = Number(v);
    if (n >= 9) return 'Excellent';
    if (n >= 7.5) return 'Good';
    if (n >= 6) return 'Average';
    return 'Below avg';
  });

  gpaColor = computed(() => {
    const v = Number(this.gpaValue());
    if (v >= 9)   return '#22c55e';
    if (v >= 7.5) return '#f59e0b';
    if (v >= 6)   return '#7c6ff7';
    return '#f43f5e';
  });

  expLabel = computed(() => {
    const v = this.form?.get('experienceYears')?.value ?? 0;
    if (v === 0) return 'Fresher / No experience';
    if (v === 1) return '1 year';
    return `${v} years`;
  });

  /** Skills grouped by category, filtered by search query */
  filteredSkillGroups = computed(() => {
    const q = this.skillSearch().toLowerCase().trim();
    const skills = this.allSkills();

    const grouped: Record<string, SkillDto[]> = {};
    for (const s of skills) {
      if (q && !s.name.toLowerCase().includes(q)) continue;
      const cat = (s as any).category ?? 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    }

    return Object.entries(grouped).map(([category, skills]) => ({ category, skills }));
  });

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName:         ['', Validators.required],
      lastName:          ['', Validators.required],
      phone:             [''],
      gpa:               [null, [Validators.min(0), Validators.max(10)]],
      workAuthStatus:    ['UNKNOWN'],
      experienceYears:   [0],
      desiredRole:       [''],
      preferredLocation: [''],
      openToRemote:      [true],
    });
  }

  ngOnInit(): void {
    // Load profile + skills in parallel
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.selectedSkills.set(p.skills.map((s) => s.name));
        this.patchForm(p);
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
      },
    });

    this.profileService.getSkillTaxonomy().subscribe({
      next: (skills) => {
        this.allSkills.set(skills);
        this.skillsLoading.set(false);
      },
      error: () => {
        this.skillsLoading.set(false);
      },
    });
  }

  // ── Template helpers ─────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  stepExp(delta: number): void {
    const ctrl = this.form.get('experienceYears');
    if (!ctrl) return;
    const val = (ctrl.value ?? 0) + delta;
    ctrl.setValue(Math.max(0, Math.min(50, val)));
  }

  toggleRemote(): void {
    const ctrl = this.form.get('openToRemote');
    if (ctrl) ctrl.setValue(!ctrl.value);
  }

  toggleSkill(name: string): void {
    this.selectedSkills.update((skills) =>
      skills.includes(name) ? skills.filter((s) => s !== name) : [...skills, name]
    );
  }

  removeSkill(name: string): void {
    this.selectedSkills.update((skills) => skills.filter((s) => s !== name));
  }

  isSelected(name: string): boolean {
    return this.selectedSkills().includes(name);
  }

  onSkillSearch(event: Event): void {
    this.skillSearch.set((event.target as HTMLInputElement).value);
  }

  clearSkillSearch(): void {
    this.skillSearch.set('');
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please correct the validation errors first.');
      return;
    }

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set('');

    const payload = {
      ...this.form.value,
      gpa: this.form.value.gpa ? Number(this.form.value.gpa) : null,
      skills: this.selectedSkills(),
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.toast.success('Profile saved successfully!');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        let msg = 'Failed to save. Please try again.';
        if (err.status === 0) {
          msg = 'Cannot connect to server. Make sure the backend is running.';
        } else {
          msg = err.error?.message || msg;
        }
        this.saveError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private patchForm(p: ProfileDto): void {
    this.form.patchValue({
      firstName:         p.firstName ?? '',
      lastName:          p.lastName ?? '',
      phone:             p.phone ?? '',
      gpa:               p.gpa ?? null,
      workAuthStatus:    p.workAuthStatus ?? 'UNKNOWN',
      experienceYears:   p.experienceYears ?? 0,
      desiredRole:       p.desiredRole ?? '',
      preferredLocation: p.preferredLocation ?? '',
      openToRemote:      p.openToRemote ?? true,
    });
  }
}
