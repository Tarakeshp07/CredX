import {
  Component, OnInit, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  DashboardService,
  MatchItem,
  MatchFilters,
  SortMode,
} from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';

const ROLE_TYPES = ['Frontend', 'Backend', 'Full-Stack', 'Data', 'AI', 'DevOps', 'Cloud', 'Mobile'];
const REMOTE_MODES = [
  { value: '',       label: 'Any' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
];
const EMP_TYPES = [
  { value: '',           label: 'Any' },
  { value: 'FULL_TIME',  label: 'Full-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PART_TIME',  label: 'Part-time' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="dash-page" style="padding-top: 0px;">
  @if (auth.isDemoMode()) {
    <div class="demo-banner">
      <span class="demo-banner__badge">Demo Mode</span>
      <span>Operating offline using mock local data. Backend connectivity is simulated.</span>
      <button class="btn-ghost" (click)="auth.logout()" style="padding: 2px 10px; font-size: 0.75rem; border-color: rgba(124, 111, 247, 0.4);">
        Exit Demo
      </button>
    </div>
  }

  <!-- BG Accents -->
  <div class="dash-bg dash-bg--tl"></div>
  <div class="dash-bg dash-bg--br"></div>

  <div class="page-container" style="margin-top: 36px;">

    <!-- Incomplete Profile Warning Banner -->
    @if (!isProfileComplete()) {
      <div class="profile-warning animate-fade-in-up">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="profile-warning__icon">
          <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
        </svg>
        <div class="profile-warning__body">
          <h4 class="profile-warning__title">Your profile is incomplete!</h4>
          <p class="profile-warning__text">To calculate accurate match scores, please set your GPA, work authorization status, and select at least one skill.</p>
        </div>
        <a routerLink="/profile" class="btn-primary profile-warning__btn">Complete Profile →</a>
      </div>
    }

    <!-- ══ Page Header ══════════════════════════════════════════════ -->
    <div class="dash-header animate-fade-in-up">
      <div>
        <h1 class="dash-header__title">
          Job <span class="gradient-text">Dashboard</span>
        </h1>
        <p class="dash-header__sub">
          Ranked by your personal Match Score — update your
          <a routerLink="/profile" class="dash-link">profile</a> to improve results
        </p>
      </div>

      <div class="dash-header__right">
        @if (!loading()) {
          <div class="dash-count animate-fade-in">
            <span class="dash-count__num">{{ displayItems().length }}</span>
            <span class="dash-count__label">{{ displayItems().length === 1 ? 'role' : 'roles' }} found</span>
          </div>
        }
        <!-- Sort -->
        <div class="dash-sort">
          @for (s of sortOptions; track s.value) {
            <button
              class="dash-sort__btn"
              [class.dash-sort__btn--active]="sortMode() === s.value"
              (click)="setSort(s.value)"
            >{{ s.label }}</button>
          }
        </div>
      </div>
    </div>

    <div class="dash-body">

      <!-- ══ Filter Panel (sidebar) ═══════════════════════════════ -->
      <aside class="dash-filters glass animate-fade-in-up" style="animation-delay:0.05s">
        <div class="dash-filters__head">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;color:#6366f1">
            <path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd"/>
          </svg>
          <span>Filters</span>
          @if (hasActiveFilters()) {
            <button class="dash-filters__clear" (click)="clearFilters()">Clear all</button>
          }
        </div>

        <!-- Search -->
        <div class="filter-group">
          <label class="filter-label">Search</label>
          <div class="filter-search-wrap">
            <svg class="filter-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/>
            </svg>
            <input
              type="text"
              class="form-input filter-search"
              placeholder="Title, company…"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              id="filter-search"
            />
          </div>
        </div>

        <!-- Role Type -->
        <div class="filter-group">
          <label class="filter-label">Role type</label>
          <div class="filter-chip-grid">
            @for (r of roleTypes; track r) {
              <button
                class="filter-chip"
                [class.filter-chip--active]="filters().roleType === r"
                (click)="toggleFilter('roleType', r)"
              >{{ r }}</button>
            }
          </div>
        </div>

        <!-- Remote Mode -->
        <div class="filter-group">
          <label class="filter-label">Work mode</label>
          <div class="filter-chip-grid">
            @for (m of remoteModes; track m.value) {
              <button
                class="filter-chip"
                [class.filter-chip--active]="filters().remoteMode === m.value || (!filters().remoteMode && !m.value)"
                (click)="setRemoteMode(m.value)"
              >{{ m.label }}</button>
            }
          </div>
        </div>

        <!-- Employment Type -->
        <div class="filter-group">
          <label class="filter-label">Job type</label>
          <div class="filter-chip-grid">
            @for (e of empTypes; track e.value) {
              <button
                class="filter-chip"
                [class.filter-chip--active]="filters().employmentType === e.value || (!filters().employmentType && !e.value)"
                (click)="setEmpType(e.value)"
              >{{ e.label }}</button>
            }
          </div>
        </div>

        <!-- Visa Sponsorship -->
        <div class="filter-group">
          <div class="filter-toggle-row">
            <div>
              <p class="filter-label" style="margin-bottom:2px;">Visa sponsorship</p>
              <p class="filter-hint">Only show sponsoring employers</p>
            </div>
            <button
              class="toggle"
              [class.toggle--on]="filters().visaSponsorship"
              (click)="toggleVisa()"
              role="switch"
              [attr.aria-checked]="filters().visaSponsorship"
              id="visa-toggle"
            ><span class="toggle__thumb"></span></button>
          </div>
        </div>

      </aside>

      <!-- ══ Job Feed ══════════════════════════════════════════════ -->
      <main class="dash-feed">

        @if (loading()) {
          <!-- Skeleton cards -->
          @for (i of [1,2,3,4,5]; track i) {
            <div class="glass job-card job-card--skeleton" [style.animation-delay]="(i*0.07)+'s'">
              <div style="display:flex;gap:16px;align-items:flex-start;">
                <div class="skeleton" style="width:64px;height:64px;border-radius:12px;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div class="skeleton" style="width:60%;height:18px;margin-bottom:10px;"></div>
                  <div class="skeleton" style="width:35%;height:13px;margin-bottom:16px;"></div>
                  <div style="display:flex;gap:8px;">
                    @for (j of [1,2,3]; track j) {
                      <div class="skeleton" style="width:70px;height:24px;border-radius:999px;"></div>
                    }
                  </div>
                </div>
                <div class="skeleton" style="width:64px;height:64px;border-radius:50%;flex-shrink:0;"></div>
              </div>
            </div>
          }
        } @else if (error()) {
          <!-- Error state -->
          <div class="dash-empty glass animate-fade-in">
            <div class="dash-empty__icon" style="background:rgba(244,63,94,0.1);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:28px;height:28px;color:#e11d48;">
                <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h3 class="dash-empty__title">Could not load jobs</h3>
            <p class="dash-empty__sub">{{ error() }}</p>
            <button class="btn-primary" (click)="loadMatches()" style="margin-top:8px;">Retry</button>
          </div>
        } @else if (displayItems().length === 0) {
          <!-- Empty state -->
          <div class="dash-empty glass animate-fade-in">
            <div class="dash-empty__icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:28px;height:28px;color:#6366f1;">
                <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h3 class="dash-empty__title">No matches found</h3>
            <p class="dash-empty__sub">Try relaxing the filters or <a routerLink="/profile" class="dash-link">updating your profile</a></p>
            @if (hasActiveFilters()) {
              <button class="btn-ghost" (click)="clearFilters()" style="margin-top:8px;">Clear filters</button>
            }
          </div>
        } @else {
          <!-- Job Cards -->
          @for (item of displayItems(); track item.job.id; let i = $index) {
            <div
              class="glass job-card animate-fade-in-up"
              [class.job-card--applied]="item.applied"
              [style.animation-delay]="(i * 0.06) + 's'"
            >
              <!-- Top Row -->
              <div class="job-card__top">

                <!-- Company Logo / Initial -->
                <div class="company-logo">
                  {{ item.job.company.charAt(0) }}
                </div>

                <!-- Title & Meta -->
                <div class="job-card__info">
                  <div class="job-card__title-row">
                    <h2 class="job-card__title">{{ item.job.title }}</h2>
                    <span class="mobile-score-badge" [class]="bandClass(item.band)">
                      {{ item.matchScore }}% {{ item.band }}
                    </span>
                    @if (item.applied) {
                      <span class="applied-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;">
                          <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
                        </svg>
                        Applied
                      </span>
                    }
                  </div>
                  <p class="job-card__company">{{ item.job.company }}</p>

                  <!-- Pill Tags -->
                  <div class="job-card__tags">
                    <span class="job-tag job-tag--location">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:11px;height:11px;">
                        <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7.003c0 2.255 1.19 4.235 2.29 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .19.153l.012.01ZM8 8.999a2 2 0 1 0 0-3.999 2 2 0 0 0 0 3.999Z" clip-rule="evenodd"/>
                      </svg>
                      {{ item.job.location }}
                    </span>
                    <span class="job-tag" [class]="remodeClass(item.job.remoteMode)">
                      {{ remoteModeLabel(item.job.remoteMode) }}
                    </span>
                    <span class="job-tag job-tag--emp">
                      {{ empLabel(item.job.employmentType) }}
                    </span>
                    @if (item.job.visaSponsorship) {
                      <span class="job-tag job-tag--visa">🌍 Visa OK</span>
                    }
                    @if (item.job.minGpa) {
                      <span class="job-tag job-tag--gpa">GPA {{ item.job.minGpa }}+</span>
                    }
                  </div>
                </div>

                <!-- Match Score Ring -->
                <div class="score-ring-wrap">
                  <svg class="score-ring" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle class="score-ring__track" cx="36" cy="36" r="30" stroke-width="6"/>
                    <circle
                      class="score-ring__fill"
                      cx="36" cy="36" r="30"
                      stroke-width="6"
                      stroke-linecap="round"
                      [attr.stroke]="bandColor(item.band)"
                      [attr.stroke-dasharray]="circumference"
                      [attr.stroke-dashoffset]="dashOffset(item.matchScore)"
                      transform="rotate(-90 36 36)"
                    />
                  </svg>
                  <div class="score-ring__label">
                    <span class="score-ring__num">{{ item.matchScore }}</span>
                    <span class="score-ring__pct">%</span>
                  </div>
                  <!-- Band -->
                  <span class="score-band" [class]="bandClass(item.band)">
                    {{ item.band }}
                  </span>
                </div>

              </div>

              <!-- Description -->
              @if (item.job.description) {
                <p class="job-card__desc">{{ item.job.description }}</p>
              }

              <!-- Required Skills -->
              @if (item.job.requiredSkills.length) {
                <div class="job-skills">
                  @for (skill of item.job.requiredSkills; track skill.id) {
                    <span
                      class="job-skill-pill"
                      [class.job-skill-pill--matched]="item.matchedSkills.includes(skill.name)"
                    >
                      @if (item.matchedSkills.includes(skill.name)) {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" style="width:10px;height:10px;">
                          <path fill-rule="evenodd" d="M10.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
                        </svg>
                      }
                      {{ skill.name }}
                    </span>
                  }
                </div>
              }

              <!-- Missing Skills Hint -->
              @if (item.missingSkills.length > 0) {
                <div class="missing-skills">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:13px;height:13px;flex-shrink:0;color:#f59e0b;">
                    <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-2.75a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V6A.75.75 0 0 1 8 5.25Zm0 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>
                  </svg>
                  <span>
                    You're missing:
                    @for (s of item.missingSkills; track s; let last = $last) {
                      <strong>{{ s }}</strong>{{ !last ? ', ' : '' }}
                    }
                    — <a routerLink="/profile" class="dash-link">add to profile →</a>
                  </span>
                </div>
              }

              <!-- Card Footer: Score Breakdown + Apply -->
              <div class="job-card__footer">
                <!-- Factor bars -->
                @if (item.matchScore > 0) {
                  <div class="score-factors">
                    <div class="score-factor">
                      <span class="score-factor__label">Skills</span>
                      <div class="score-factor__bar-wrap">
                        <div class="score-factor__bar" [style.width]="skillFactor(item) + '%'" style="background:#6366f1;"></div>
                      </div>
                      <span class="score-factor__val">{{ skillFactor(item) | number:'1.0-0' }}%</span>
                    </div>
                    <div class="score-factor">
                      <span class="score-factor__label">GPA</span>
                      <div class="score-factor__bar-wrap">
                        <div class="score-factor__bar" [style.width]="gpaSub(item) + '%'" style="background:#22d3ee;"></div>
                      </div>
                      <span class="score-factor__val">{{ gpaSub(item) | number:'1.0-0' }}%</span>
                    </div>
                    <div class="score-factor">
                      <span class="score-factor__label">Exp</span>
                      <div class="score-factor__bar-wrap">
                        <div class="score-factor__bar" [style.width]="expSub(item) + '%'" style="background:#a855f7;"></div>
                      </div>
                      <span class="score-factor__val">{{ expSub(item) | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                }

                <!-- Apply / Withdraw -->
                <button
                  class="apply-btn"
                  [class.apply-btn--applied]="item.applied"
                  [class.apply-btn--loading]="applyingId() === item.job.id"
                  [disabled]="applyingId() === item.job.id"
                  (click)="onApply(item)"
                  [id]="'apply-' + item.job.id"
                >
                  @if (applyingId() === item.job.id) {
                    <span class="apply-spinner"></span>
                  } @else if (item.applied) {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;">
                      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                      <path fill-rule="evenodd" d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.239.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clip-rule="evenodd"/>
                    </svg>
                    Withdraw
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;">
                      <path fill-rule="evenodd" d="M8 1.5a.75.75 0 0 1 .75.75v5h5a.75.75 0 0 1 0 1.5h-5v5a.75.75 0 0 1-1.5 0v-5h-5a.75.75 0 0 1 0-1.5h5v-5A.75.75 0 0 1 8 1.5Z" clip-rule="evenodd"/>
                    </svg>
                    Apply
                  }
                </button>

              </div>
            </div>
          }
        }

      </main>
    </div>
  </div>
</div>
  `,
  styles: [`
    /* ── Page ── */
    .dash-page {
      min-height: calc(100vh - 64px);
      padding: 36px 0 80px;
      position: relative;
      overflow-x: hidden;
    }

    /* Incomplete Profile Warning */
    .profile-warning {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: var(--radius-card);
      margin-bottom: 24px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .profile-warning__icon {
      width: 24px;
      height: 24px;
      color: #d97706;
      flex-shrink: 0;
    }

    .profile-warning__body {
      flex: 1;
    }

    .profile-warning__title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #b45309;
      margin: 0 0 2px;
    }

    .profile-warning__text {
      font-size: 0.85rem;
      color: #78350f;
      margin: 0;
    }

    .profile-warning__btn {
      padding: 8px 16px;
      font-size: 0.82rem;
      box-shadow: none;
    }

    @media (max-width: 640px) {
      .profile-warning {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .profile-warning__btn {
        width: 100%;
        text-align: center;
      }
    }

    .dash-bg {
      position: fixed;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      filter: blur(160px);
      pointer-events: none;
      z-index: 0;
    }

    .dash-bg--tl {
      top: -250px;
      left: -200px;
      background: radial-gradient(circle, rgba(124,111,247,0.07) 0%, transparent 70%);
    }

    .dash-bg--br {
      bottom: -250px;
      right: -200px;
      background: radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%);
    }

    .page-container { position: relative; z-index: 1; }

    /* ── Header ── */
    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .dash-header__title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
      letter-spacing: -0.03em;
    }

    .dash-header__sub {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .dash-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .dash-link:hover { color: #3730a3; }

    .dash-header__right {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .dash-count {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }

    .dash-count__num {
      font-size: 2rem;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.04em;
    }

    .dash-count__label {
      font-size: 0.85rem;
      color: #64748b;
    }

    /* Sort */
    .dash-sort {
      display: flex;
      background: var(--color-surface-700);
      border: 1px solid var(--color-surface-600);
      border-radius: 10px;
      overflow: hidden;
    }

    .dash-sort__btn {
      padding: 7px 14px;
      background: none;
      border: none;
      color: #64748b;
      font-family: var(--font-sans);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dash-sort__btn:hover { color: #0f172a; }

    .dash-sort__btn--active {
      background: rgba(99, 102, 241, 0.12);
      color: #4f46e5;
    }

    /* ── Body Layout ── */
    .dash-body {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* ── Filter Sidebar ── */
    .dash-filters {
      padding: 20px;
      position: sticky;
      top: 84px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .dash-filters__head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      color: #334155;
    }

    .dash-filters__clear {
      margin-left: auto;
      background: none;
      border: none;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-sans);
      padding: 0;
      transition: color 0.2s;
    }

    .dash-filters__clear:hover { color: #3730a3; text-decoration: underline; }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
    }

    .filter-hint {
      font-size: 0.72rem;
      color: #94a3b8;
      margin: 0;
    }

    .filter-search-wrap {
      position: relative;
    }

    .filter-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px;
      height: 15px;
      color: #475569;
      pointer-events: none;
    }

    .filter-search {
      padding-left: 36px !important;
      font-size: 0.85rem;
    }

    .filter-chip-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .filter-chip {
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      border: 1px solid var(--color-surface-600);
      background: #ffffff;
      color: #475569;
      cursor: pointer;
      transition: all 0.18s;
      font-family: var(--font-sans);
    }

    .filter-chip:hover {
      border-color: rgba(99,102,241,0.45);
      color: #4f46e5;
      background: rgba(99,102,241,0.05);
    }

    .filter-chip--active {
      background: rgba(99,102,241,0.12);
      border-color: #6366f1;
      color: #4f46e5;
      font-weight: 600;
    }

    .filter-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    /* Toggle (shared with profile) */
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      border-radius: 999px;
      background: var(--color-surface-500);
      border: 1px solid var(--color-surface-500);
      cursor: pointer;
      transition: all 0.25s;
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
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.25s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .toggle--on .toggle__thumb {
      transform: translateX(20px);
    }

    /* ── Feed ── */
    .dash-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ── Job Card ── */
    .job-card {
      padding: 24px;
      transition: all 0.25s ease;
      cursor: default;
    }

    .job-card:hover {
      border-color: rgba(99,102,241,0.35);
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(15,23,42,0.08), 0 0 0 1px rgba(99,102,241,0.08);
    }

    .job-card--applied {
      border-color: rgba(22,163,74,0.3);
    }

    .job-card--skeleton {
      cursor: default;
    }

    .job-card--skeleton:hover {
      transform: none;
      box-shadow: none;
    }

    .job-card__top {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    /* Company Logo */
    .company-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
      border: 1px solid rgba(99,102,241,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 800;
      color: #4f46e5;
      flex-shrink: 0;
    }

    .job-card__info { flex: 1; min-width: 0; }

    .job-card__title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }

    .job-card__title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .applied-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(22,163,74,0.1);
      border: 1px solid rgba(22,163,74,0.25);
      color: #15803d;
    }

    .job-card__company {
      font-size: 0.85rem;
      color: #4f46e5;
      font-weight: 600;
      margin: 0 0 10px;
    }

    .job-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .job-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 500;
      border: 1px solid var(--color-surface-600);
      background: var(--color-surface-700);
      color: #475569;
    }

    .job-tag--location { color: #64748b; }

    .job-tag--remote-remote  { color: #0e7490; border-color: rgba(6,182,212,0.3);  background: rgba(6,182,212,0.08); }
    .job-tag--remote-hybrid  { color: #7e22ce; border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.08); }
    .job-tag--remote-onsite  { color: #64748b; }

    .job-tag--emp   { color: #64748b; }
    .job-tag--visa  { color: #15803d; border-color: rgba(22,163,74,0.3);  background: rgba(22,163,74,0.08); }
    .job-tag--gpa   { color: #b45309; border-color: rgba(217,119,6,0.3);  background: rgba(217,119,6,0.08); }

    /* ── Score Ring ── */
    .score-ring-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .score-ring {
      width: 72px;
      height: 72px;
      filter: drop-shadow(0 2px 6px rgba(99,102,241,0.15));
    }

    .score-ring__track {
      stroke: var(--color-surface-600);
    }

    .score-ring__fill {
      transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .score-ring__label {
      position: absolute;
      display: flex;
      align-items: baseline;
      gap: 1px;
    }

    /* Overlay the text on SVG */
    .score-ring-wrap {
      position: relative;
    }

    .score-ring__label {
      position: absolute;
      top: 17px;
      left: 50%;
      transform: translateX(-50%);
    }

    .score-ring__num {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }

    .score-ring__pct {
      font-size: 0.6rem;
      font-weight: 600;
      color: #475569;
    }

    .score-band {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 999px;
    }

    /* Band colours */
    .band-strong { background: rgba(22,163,74,0.1);   color: #15803d; border: 1px solid rgba(22,163,74,0.25); }
    .band-good   { background: rgba(217,119,6,0.1);   color: #b45309; border: 1px solid rgba(217,119,6,0.25); }
    .band-fair   { background: rgba(100,116,139,0.1); color: #475569; border: 1px solid rgba(100,116,139,0.2); }

    .mobile-score-badge {
      display: none;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }

    @media (max-width: 600px) {
      .mobile-score-badge {
        display: inline-flex;
        align-items: center;
      }
    }

    /* ── Description ── */
    .job-card__desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 16px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Skills ── */
    .job-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .job-skill-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 500;
      border: 1px solid var(--color-surface-600);
      background: var(--color-surface-700);
      color: #64748b;
    }

    .job-skill-pill--matched {
      background: rgba(99,102,241,0.1);
      border-color: rgba(99,102,241,0.35);
      color: #4f46e5;
      font-weight: 600;
    }

    /* ── Missing Skills ── */
    .missing-skills {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(217, 119, 6, 0.08);
      border: 1px solid rgba(217, 119, 6, 0.2);
      border-radius: 10px;
      font-size: 0.8rem;
      color: #78350f;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .missing-skills strong {
      color: #b45309;
      font-weight: 600;
    }

    /* ── Card Footer ── */
    .job-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid var(--color-surface-600);
      padding-top: 16px;
      flex-wrap: wrap;
    }

    /* Score Factors */
    .score-factors {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1;
      min-width: 200px;
    }

    .score-factor {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .score-factor__label {
      font-size: 0.68rem;
      font-weight: 600;
      color: #64748b;
      width: 28px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .score-factor__bar-wrap {
      flex: 1;
      height: 4px;
      background: var(--color-surface-600);
      border-radius: 2px;
      overflow: hidden;
    }

    .score-factor__bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .score-factor__val {
      font-size: 0.68rem;
      font-weight: 600;
      color: #475569;
      width: 30px;
      text-align: right;
    }

    /* Apply Button */
    .apply-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 20px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      color: #fff;
      box-shadow: 0 4px 12px rgba(99,102,241,0.25);
    }

    .apply-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
    }

    .apply-btn--applied {
      background: var(--color-surface-700);
      border: 1px solid var(--color-surface-500);
      color: #64748b;
      box-shadow: none;
    }

    .apply-btn--applied:hover:not(:disabled) {
      background: rgba(244,63,94,0.08);
      border-color: rgba(244,63,94,0.35);
      color: #e11d48;
      box-shadow: none;
      transform: none;
    }

    .apply-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .apply-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Empty / Error State ── */
    .dash-empty {
      padding: 60px 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .dash-empty__icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: rgba(99,102,241,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dash-empty__title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .dash-empty__sub {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      max-width: 300px;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .dash-body {
        grid-template-columns: 1fr;
      }

      .dash-filters {
        position: static;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 16px;
      }

      .dash-filters__head { width: 100%; }
      .filter-group { min-width: 180px; }
    }

    @media (max-width: 600px) {
      .score-ring-wrap { display: none; }
      .dash-header__title { font-size: 1.5rem; }
      .job-card { padding: 18px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // ── State ─────────────────────────────────────────────────────────────────
  items       = signal<MatchItem[]>([]);
  loading     = signal(true);
  error       = signal('');
  sortMode    = signal<SortMode>('score');
  filters     = signal<MatchFilters>({});
  applyingId  = signal<number | null>(null);
  isProfileComplete = signal<boolean>(true);

  searchQuery = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly roleTypes   = ROLE_TYPES;
  readonly remoteModes = REMOTE_MODES;
  readonly empTypes    = EMP_TYPES;
  readonly circumference = 2 * Math.PI * 30; // r=30

  readonly sortOptions = [
    { value: 'score'  as SortMode, label: '★ Score' },
    { value: 'recent' as SortMode, label: '🕐 Recent' },
    { value: 'title'  as SortMode, label: 'A–Z' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────
  displayItems = computed(() => {
    const list = [...this.items()];
    switch (this.sortMode()) {
      case 'recent': return list.reverse();
      case 'title':  return list.sort((a, b) => a.job.title.localeCompare(b.job.title));
      default:       return list; // already sorted by score from backend
    }
  });

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.roleType || f.remoteMode || f.employmentType || f.visaSponsorship || f.search);
  });

  constructor(
    private dashService: DashboardService,
    private profileService: ProfileService,
    public auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMatches();
    this.checkProfileCompleteness();
  }

  checkProfileCompleteness(): void {
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.isProfileComplete.set(p.profileCompleted);
      },
      error: () => {
        // Silent fail or default to true to not annoy user on auth error
        this.isProfileComplete.set(true);
      }
    });
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  loadMatches(): void {
    this.loading.set(true);
    this.error.set('');

    this.dashService.getMatches(this.filters()).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        let msg = 'Failed to load jobs.';
        if (err.status === 0) {
          msg = 'Cannot connect to server. Make sure the backend is running.';
        } else if (err.status === 403) {
          msg = 'Only students can view job matches. Please log in as a student.';
        } else {
          msg = err.error?.message || msg;
        }
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  toggleFilter(key: keyof MatchFilters, value: string): void {
    this.filters.update((f) => ({
      ...f,
      [key]: f[key] === value ? undefined : value,
    }));
    this.loadMatches();
  }

  setRemoteMode(value: string): void {
    this.filters.update((f) => ({ ...f, remoteMode: value || undefined }));
    this.loadMatches();
  }

  setEmpType(value: string): void {
    this.filters.update((f) => ({ ...f, employmentType: value || undefined }));
    this.loadMatches();
  }

  toggleVisa(): void {
    this.filters.update((f) => ({
      ...f,
      visaSponsorship: f.visaSponsorship ? undefined : true,
    }));
    this.loadMatches();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filters.update((f) => ({ ...f, search: this.searchQuery || undefined }));
      this.loadMatches();
    }, 400);
  }

  clearFilters(): void {
    this.filters.set({});
    this.searchQuery = '';
    this.loadMatches();
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  setSort(mode: SortMode): void {
    this.sortMode.set(mode);
  }

  // ── Apply / Withdraw ──────────────────────────────────────────────────────

  onApply(item: MatchItem): void {
    this.applyingId.set(item.job.id);
    const wasApplied = item.applied;

    const action$ = wasApplied
      ? this.dashService.withdraw(item.job.id)
      : this.dashService.apply(item.job.id);

    action$.subscribe({
      next: () => {
        // Toggle applied state locally (instant feedback)
        this.items.update((list) =>
          list.map((m) =>
            m.job.id === item.job.id ? { ...m, applied: !m.applied } : m
          )
        );
        this.applyingId.set(null);
        if (wasApplied) {
          this.toast.info(`Withdrew application from ${item.job.company}.`);
        } else {
          this.toast.success(`Applied successfully to ${item.job.title} at ${item.job.company}!`);
        }
      },
      error: (err) => {
        this.applyingId.set(null);
        const msg = err.error?.message || (wasApplied ? 'Failed to withdraw application.' : 'Failed to apply.');
        this.toast.error(msg);
      },
    });
  }

  // ── Score Ring Helpers ────────────────────────────────────────────────────

  dashOffset(score: number): number {
    return this.circumference * (1 - score / 100);
  }

  bandColor(band: string): string {
    switch (band?.toUpperCase()) {
      case 'STRONG': return '#22c55e';
      case 'GOOD':   return '#f59e0b';
      default:       return '#64748b';
    }
  }

  bandClass(band: string): string {
    switch (band?.toUpperCase()) {
      case 'STRONG': return 'score-band band-strong';
      case 'GOOD':   return 'score-band band-good';
      default:       return 'score-band band-fair';
    }
  }

  // ── Tag Helpers ───────────────────────────────────────────────────────────

  remodeClass(mode: string): string {
    switch (mode) {
      case 'REMOTE': return 'job-tag job-tag--remote-remote';
      case 'HYBRID': return 'job-tag job-tag--remote-hybrid';
      default:       return 'job-tag job-tag--remote-onsite';
    }
  }

  remoteModeLabel(mode: string): string {
    switch (mode) {
      case 'REMOTE': return '🌐 Remote';
      case 'HYBRID': return '⚡ Hybrid';
      default:       return '🏢 On-site';
    }
  }

  empLabel(type: string): string {
    switch (type) {
      case 'FULL_TIME':  return 'Full-time';
      case 'INTERNSHIP': return 'Internship';
      case 'PART_TIME':  return 'Part-time';
      default:           return type;
    }
  }

  // ── Factor Bar Helpers ────────────────────────────────────────────────────

  skillFactor(item: MatchItem): number {
    const total = item.job.requiredSkills.length;
    if (!total) return 0;
    return Math.round((item.matchedSkills.length / total) * 100);
  }

  gpaSub(item: MatchItem): number {
    // Approximation from overall score (GPA is 25% weight)
    return Math.min(100, Math.round(item.matchScore * 0.4));
  }

  expSub(item: MatchItem): number {
    // Approximation from overall score (Experience is 15% weight)
    return Math.min(100, Math.round(item.matchScore * 0.25));
  }
}
