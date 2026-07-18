import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---- Skill taxonomy: canonical name -> synonyms (lowercased, comma-joined) ----
const SKILLS: { name: string; category: string; synonyms: string[] }[] = [
  { name: 'JavaScript', category: 'Language', synonyms: ['js', 'ecmascript', 'es6'] },
  { name: 'TypeScript', category: 'Language', synonyms: ['ts'] },
  { name: 'Python', category: 'Language', synonyms: ['py'] },
  { name: 'Java', category: 'Language', synonyms: [] },
  { name: 'SQL', category: 'Database', synonyms: ['mysql', 'postgres', 'postgresql'] },
  { name: 'React', category: 'Frontend', synonyms: ['reactjs', 'react.js'] },
  { name: 'Next.js', category: 'Frontend', synonyms: ['nextjs', 'next'] },
  { name: 'Node.js', category: 'Backend', synonyms: ['node', 'nodejs'] },
  { name: 'NestJS', category: 'Backend', synonyms: ['nest'] },
  { name: 'Spring Boot', category: 'Backend', synonyms: ['spring', 'springboot'] },
  { name: 'Docker', category: 'DevOps', synonyms: ['containers'] },
  { name: 'Kubernetes', category: 'DevOps', synonyms: ['k8s'] },
  { name: 'AWS', category: 'Cloud', synonyms: ['amazon web services'] },
  { name: 'Machine Learning', category: 'AI', synonyms: ['ml'] },
  { name: 'TensorFlow', category: 'AI', synonyms: ['tf'] },
  { name: 'Pandas', category: 'Data', synonyms: [] },
  { name: 'Git', category: 'Tooling', synonyms: ['github', 'version control'] },
  { name: 'REST APIs', category: 'Backend', synonyms: ['rest', 'restful', 'api'] },
  { name: 'GraphQL', category: 'Backend', synonyms: ['gql'] },
  { name: 'HTML/CSS', category: 'Frontend', synonyms: ['html', 'css', 'tailwind'] },
];

type JobSeed = {
  title: string;
  company: string;
  roleType: string;
  employmentType: string;
  location: string;
  remoteMode: string;
  visaSponsorship: boolean;
  minGpa?: number;
  minExperience: number;
  description: string;
  skills: string[];
};

const JOBS: JobSeed[] = [
  { title: 'Backend Engineer Intern', company: 'Nimbus Labs', roleType: 'Backend', employmentType: 'INTERNSHIP', location: 'Bengaluru', remoteMode: 'HYBRID', visaSponsorship: false, minGpa: 7.0, minExperience: 0, description: 'Build REST APIs with Node.js and SQL.', skills: ['Node.js', 'REST APIs', 'SQL', 'Git'] },
  { title: 'Frontend Developer', company: 'Pixelworks', roleType: 'Frontend', employmentType: 'FULL_TIME', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: true, minGpa: 6.5, minExperience: 1, description: 'React + Next.js product UI.', skills: ['React', 'Next.js', 'TypeScript', 'HTML/CSS'] },
  { title: 'Full-Stack Engineer', company: 'Stackforge', roleType: 'Full-Stack', employmentType: 'FULL_TIME', location: 'Hyderabad', remoteMode: 'ONSITE', visaSponsorship: false, minGpa: 7.0, minExperience: 2, description: 'End-to-end features across React and Node.', skills: ['React', 'Node.js', 'TypeScript', 'SQL', 'REST APIs'] },
  { title: 'Data Science Intern', company: 'Quantum Analytics', roleType: 'Data', employmentType: 'INTERNSHIP', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: false, minGpa: 8.0, minExperience: 0, description: 'ML models with Python and Pandas.', skills: ['Python', 'Pandas', 'Machine Learning'] },
  { title: 'ML Engineer', company: 'DeepMind Systems', roleType: 'AI', employmentType: 'FULL_TIME', location: 'London', remoteMode: 'HYBRID', visaSponsorship: true, minGpa: 8.0, minExperience: 3, description: 'Production ML with TensorFlow.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'] },
  { title: 'Java Backend Developer', company: 'Enterprise Soft', roleType: 'Backend', employmentType: 'FULL_TIME', location: 'Pune', remoteMode: 'ONSITE', visaSponsorship: false, minGpa: 6.5, minExperience: 2, description: 'Spring Boot microservices.', skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'] },
  { title: 'DevOps Intern', company: 'CloudScale', roleType: 'DevOps', employmentType: 'INTERNSHIP', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: false, minGpa: 7.0, minExperience: 0, description: 'Docker + Kubernetes pipelines on AWS.', skills: ['Docker', 'Kubernetes', 'AWS', 'Git'] },
  { title: 'Node.js API Developer', company: 'Apiary', roleType: 'Backend', employmentType: 'FULL_TIME', location: 'Chennai', remoteMode: 'HYBRID', visaSponsorship: false, minGpa: 6.0, minExperience: 1, description: 'NestJS + GraphQL services.', skills: ['Node.js', 'NestJS', 'GraphQL', 'TypeScript'] },
  { title: 'Junior Frontend Intern', company: 'Bright UI', roleType: 'Frontend', employmentType: 'INTERNSHIP', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: false, minGpa: 6.0, minExperience: 0, description: 'Build UI with React and Tailwind.', skills: ['React', 'JavaScript', 'HTML/CSS'] },
  { title: 'Cloud Engineer', company: 'SkyOps', roleType: 'Cloud', employmentType: 'FULL_TIME', location: 'Berlin', remoteMode: 'HYBRID', visaSponsorship: true, minGpa: 7.0, minExperience: 3, description: 'AWS infra with Docker/K8s.', skills: ['AWS', 'Docker', 'Kubernetes', 'Python'] },
  { title: 'Software Engineer (New Grad)', company: 'Foundry', roleType: 'Full-Stack', employmentType: 'FULL_TIME', location: 'Bengaluru', remoteMode: 'ONSITE', visaSponsorship: false, minGpa: 7.5, minExperience: 0, description: 'General SWE across the stack.', skills: ['JavaScript', 'SQL', 'Git', 'REST APIs'] },
  { title: 'Data Analyst Intern', company: 'InsightCo', roleType: 'Data', employmentType: 'INTERNSHIP', location: 'Mumbai', remoteMode: 'HYBRID', visaSponsorship: false, minGpa: 7.0, minExperience: 0, description: 'SQL + Python analytics.', skills: ['SQL', 'Python', 'Pandas'] },
  { title: 'Platform Engineer', company: 'Corelayer', roleType: 'Backend', employmentType: 'FULL_TIME', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: true, minGpa: 7.0, minExperience: 4, description: 'Node + Kubernetes platform.', skills: ['Node.js', 'Kubernetes', 'Docker', 'TypeScript', 'AWS'] },
  { title: 'GraphQL Backend Intern', company: 'Graphly', roleType: 'Backend', employmentType: 'INTERNSHIP', location: 'Remote', remoteMode: 'REMOTE', visaSponsorship: false, minGpa: 6.5, minExperience: 0, description: 'Build GraphQL APIs in NestJS.', skills: ['GraphQL', 'NestJS', 'Node.js', 'TypeScript'] },
  { title: 'Senior React Engineer', company: 'Vantage', roleType: 'Frontend', employmentType: 'FULL_TIME', location: 'San Francisco', remoteMode: 'HYBRID', visaSponsorship: true, minGpa: 7.0, minExperience: 5, description: 'Lead React/Next architecture.', skills: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'HTML/CSS'] },
];

async function main() {
  console.log('🌱 Seeding...');

  // Roles
  const roles = [
    { id: 1, roleName: 'ADMIN' },
    { id: 2, roleName: 'RECRUITER' },
    { id: 3, roleName: 'STUDENT' },
  ];
  for (const r of roles) {
    await prisma.roleMaster.upsert({ where: { id: r.id }, update: { roleName: r.roleName }, create: r });
  }

  // Skills
  const skillByName = new Map<string, number>();
  for (const s of SKILLS) {
    const rec = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, synonyms: s.synonyms.join(',') },
      create: { name: s.name, category: s.category, synonyms: s.synonyms.join(',') },
    });
    skillByName.set(s.name, rec.id);
  }

  // Recruiter account
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@credx.dev' },
    update: {},
    create: {
      email: 'recruiter@credx.dev',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Rita',
      lastName: 'Recruiter',
      roleId: 2,
    },
  });

  // Jobs + required skills
  for (const j of JOBS) {
    const existing = await prisma.jobPosting.findFirst({ where: { title: j.title, company: j.company } });
    if (existing) continue;
    const job = await prisma.jobPosting.create({
      data: {
        title: j.title,
        company: j.company,
        roleType: j.roleType,
        employmentType: j.employmentType,
        location: j.location,
        remoteMode: j.remoteMode,
        visaSponsorship: j.visaSponsorship,
        minGpa: j.minGpa ?? null,
        minExperience: j.minExperience,
        description: j.description,
        status: 'ACTIVE',
        postedById: recruiter.id,
      },
    });
    for (const skillName of j.skills) {
      const skillId = skillByName.get(skillName);
      if (skillId) {
        await prisma.jobRequiredSkill.create({ data: { jobId: job.id, skillId, weight: 1 } });
      }
    }
  }

  // Demo student with a partial skill set (so match scores vary nicely)
  const student = await prisma.user.upsert({
    where: { email: 'student@credx.dev' },
    update: {},
    create: {
      email: 'student@credx.dev',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Sam',
      lastName: 'Student',
      roleId: 3,
      gpa: 7.6,
      workAuthStatus: 'CITIZEN',
      experienceYears: 1,
      desiredRole: 'Backend',
      preferredLocation: 'Remote',
      openToRemote: true,
      profileCompleted: true,
    },
  });
  const studentSkills = ['JavaScript', 'TypeScript', 'Node.js', 'React', 'SQL', 'Git', 'REST APIs'];
  for (const name of studentSkills) {
    const skillId = skillByName.get(name);
    if (skillId) {
      await prisma.studentSkill.upsert({
        where: { userId_skillId: { userId: student.id, skillId } },
        update: {},
        create: { userId: student.id, skillId, proficiency: 4 },
      });
    }
  }

  console.log('✅ Seed complete.');
  console.log('   Student : student@credx.dev / password123');
  console.log('   Recruiter: recruiter@credx.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
