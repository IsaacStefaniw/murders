"""1,000 reviewer personas, deterministic, spread across the six week shapes in
docs/MARKETS.md plus the rebuilder, with real variety in age, household,
goal, tech comfort, budget, country and attitude. Writes batches/agent-NN.json."""
import json, os, random

random.seed(20260904)
OUT = os.path.join(os.path.dirname(__file__), 'batches')
os.makedirs(OUT, exist_ok=True)

SHAPES = [
    ('employed professional', 0.28), ('operator: founder, exec or freelancer', 0.20),
    ('shift worker (nursing, trades, hospitality, emergency, FIFO)', 0.16),
    ('student or early career', 0.10), ('carer at home (children or a parent)', 0.12),
    ('retiree or third act', 0.08), ('rebuilder: back from illness, burnout, divorce or redundancy', 0.06),
]
AGES = ['22–27', '28–34', '35–42', '43–50', '51–58', '59–66', '67+']
HOUSEHOLD = ['lives alone', 'partner, no kids', 'partner and young kids', 'partner and teenagers', 'single parent', 'sharehouse', 'caring for a parent at home', 'empty nest']
GOALS = ['get strong again after years off', 'lose 8 kg without a diet', 'stop doom-scrolling at night', 'sleep through the night', 'save a house deposit',
         'run a business without it eating the family', 'be a calmer parent', 'train for a half marathon', 'quit vaping', 'drink less on weeknights',
         'get a promotion without burning out', 'reconnect with my partner', 'manage energy on night shifts', 'build a routine after retirement', 'recover fitness after surgery',
         'stop working until midnight', 'eat properly while studying', 'feel less anxious', 'keep up with the kids on weekends', 'get my money under control']
TECH = ['uses apps constantly, quick to judge', 'comfortable but impatient', 'average, needs things spelled out', 'wary, deletes apps that ask too much', 'first smartwatch this year, no Health data yet']
BUDGET = ['pays for two or three subscriptions already', 'hates subscriptions, buys lifetime if convinced', 'will pay only if the free tier proves it', 'tight budget, every dollar argued', 'company pays for wellbeing tools']
COUNTRY = ['Brisbane', 'Sydney', 'Melbourne', 'Perth', 'regional Queensland', 'Auckland', 'London', 'Manchester', 'Austin', 'Toronto', 'Singapore', 'Dublin']
ATTITUDE = ['sceptical of wellness apps', 'burned by a coaching app that nagged', 'loves data and charts', 'wants to be told what to do, no explanations', 'allergic to jargon',
            'reads every privacy policy', 'has ADHD and needs the next step only', 'evidence-first, cites papers', 'time-poor, gives an app ninety seconds', 'sentimental about family time']
HEALTH = ['no conditions', 'bad knee', 'lower back that flares', 'on antidepressants, sleep is patchy', 'pregnant, second trimester', 'type 2 diabetes managed with a GP', 'recovering from shoulder surgery', 'menopause symptoms, sleep broken', 'nothing wrong, wants performance']
DEVICE = ['iPhone 15', 'iPhone 13', 'iPhone SE, small screen', 'iPhone 16 Pro with Apple Watch', 'iPhone 12, storage nearly full']

def pick_shape():
    r = random.random(); acc = 0
    for s, w in SHAPES:
        acc += w
        if r <= acc: return s
    return SHAPES[-1][0]

personas = []
for i in range(1000):
    p = {
        'id': f'P{i+1:04d}',
        'week_shape': pick_shape(),
        'age': random.choice(AGES),
        'household': random.choice(HOUSEHOLD),
        'goal': random.choice(GOALS),
        'tech': random.choice(TECH),
        'budget': random.choice(BUDGET),
        'lives_in': random.choice(COUNTRY),
        'attitude': random.choice(ATTITUDE),
        'health': random.choice(HEALTH),
        'device': random.choice(DEVICE),
        'sex_at_birth': random.choice(['female', 'male']),
        'found_via': random.choice(['a friend', 'a Reddit thread about planners', 'a podcast', 'an HR wellbeing email at work', 'the App Store search for "habit"', 'a LinkedIn post', 'a run club']),
    }
    personas.append(p)

for b in range(50):
    batch = personas[b*20:(b+1)*20]
    json.dump(batch, open(os.path.join(OUT, f'agent-{b+1:02d}.json'), 'w'), indent=1)
json.dump(personas, open(os.path.join(os.path.dirname(__file__), 'personas-all.json'), 'w'))
print('wrote', len(personas), 'personas in 50 batches')
