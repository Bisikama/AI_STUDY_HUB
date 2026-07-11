import { PrismaClient } from '../../generated/prisma/client';

type DemoSubject = {
  code: string;
  name: string;
  description: string;
};

const DEMO_MAJOR_SUBJECTS: Record<string, { name: string; subjects: DemoSubject[] }> = {
  SE: {
    name: 'Software Engineering',
    subjects: [
      {
        code: 'PRN212',
        name: 'C# Programming and .NET',
        description:
          'Core C# programming, object-oriented programming, and .NET application development',
      },
      {
        code: 'PRJ301',
        name: 'Java Web Application Development',
        description:
          'Build Java web applications using servlet, JSP, MVC, and database integration',
      },
      {
        code: 'SWR302',
        name: 'Software Requirements',
        description:
          'Requirements engineering, analysis, specification, and validation for software projects',
      },
      {
        code: 'SWD391',
        name: 'Software Architecture and Design',
        description:
          'Software design patterns, architecture styles, and system design documentation',
      },
      {
        code: 'SDN301m',
        name: 'Software Development with NodeJS',
        description: 'Backend development with NodeJS, REST APIs, and modern JavaScript tooling',
      },
    ],
  },
  AI: {
    name: 'Artificial Intelligence',
    subjects: [
      {
        code: 'AIG201c',
        name: 'Artificial Intelligence Fundamentals',
        description:
          'Foundations of artificial intelligence, search, reasoning, and intelligent agents',
      },
      {
        code: 'AIG202c',
        name: 'Applied Artificial Intelligence',
        description: 'Applied AI techniques for solving real-world academic and business problems',
      },
      {
        code: 'MAI391',
        name: 'Machine Learning',
        description:
          'Supervised and unsupervised learning, model evaluation, and machine learning pipelines',
      },
      {
        code: 'NLP301c',
        name: 'Natural Language Processing',
        description: 'Text processing, language models, embeddings, and NLP applications',
      },
      {
        code: 'AIL302m',
        name: 'Deep Learning',
        description: 'Neural networks, deep learning architectures, and training techniques',
      },
    ],
  },
  IS: {
    name: 'Information Systems',
    subjects: [
      {
        code: 'DBI202',
        name: 'Database Systems',
        description:
          'Relational database design, SQL queries, normalization, and database management',
      },
      {
        code: 'ISP392',
        name: 'Information Systems Project',
        description: 'Information system project planning, implementation, and evaluation',
      },
      {
        code: 'ISM302',
        name: 'Information Systems Management',
        description: 'Managing information systems, business processes, and organizational data',
      },
      {
        code: 'ISC301',
        name: 'Information Systems Control',
        description: 'Information system control, governance, audit, and risk management',
      },
      {
        code: 'ITA301',
        name: 'IT Architecture',
        description: 'Enterprise IT architecture, infrastructure planning, and system integration',
      },
    ],
  },
  BA: {
    name: 'Business Administration',
    subjects: [
      {
        code: 'ACC101',
        name: 'Principles of Accounting',
        description: 'Basic accounting concepts, financial statements, and business transactions',
      },
      {
        code: 'MGT103',
        name: 'Principles of Management',
        description: 'Management functions, organizational behavior, planning, and leadership',
      },
      {
        code: 'MKT101',
        name: 'Principles of Marketing',
        description: 'Marketing fundamentals, consumer behavior, segmentation, and marketing mix',
      },
      {
        code: 'FIN201',
        name: 'Corporate Finance',
        description:
          'Financial analysis, capital budgeting, investment decisions, and corporate finance basics',
      },
      {
        code: 'ECO102',
        name: 'Microeconomics',
        description:
          'Supply, demand, market equilibrium, consumer behavior, and firm decision-making',
      },
    ],
  },
  GD: {
    name: 'Graphic Design',
    subjects: [
      {
        code: 'GDF102',
        name: 'Graphic Design Fundamentals',
        description: 'Basic principles of visual design, layout, typography, and composition',
      },
      {
        code: 'VCM202',
        name: 'Visual Communication',
        description: 'Visual storytelling, communication design, and brand-oriented visual systems',
      },
      {
        code: 'WED201c',
        name: 'Web Design',
        description:
          'Designing user-friendly websites with layout, color, typography, and responsive principles',
      },
      {
        code: 'DMA301m',
        name: 'Digital Media Arts',
        description: 'Digital content creation, media production, and creative design workflows',
      },
      {
        code: 'DMS301m',
        name: 'Digital Media Strategy',
        description:
          'Planning and evaluating digital media campaigns and creative communication strategies',
      },
    ],
  },
};

export async function seedSubjects(prisma: PrismaClient) {
  console.log('📚 Creating demo majors and subjects...');

  const majorEntries = await Promise.all(
    Object.entries(DEMO_MAJOR_SUBJECTS).map(([code, major]) =>
      prisma.major.create({
        data: {
          code,
          name: major.name,
          isActive: true,
        },
      }),
    ),
  );

  const majorByCode = new Map(majorEntries.map((major) => [major.code, major]));

  const subjects: Array<{ id: number; code: string; name: string }> = [];

  for (const [majorCode, majorConfig] of Object.entries(DEMO_MAJOR_SUBJECTS)) {
    const major = majorByCode.get(majorCode);

    if (!major) {
      throw new Error(`Missing major for code ${majorCode}`);
    }

    for (const subject of majorConfig.subjects) {
      const createdSubject = await prisma.subject.create({
        data: {
          code: subject.code,
          name: subject.name,
          description: subject.description,
          isSystem: true,
          majors: {
            create: [{ majorId: major.id }],
          },
        },
      });

      subjects.push(createdSubject);
    }
  }

  console.log(`✅ Created ${majorEntries.length} majors and ${subjects.length} subjects\n`);

  return subjects;
}
