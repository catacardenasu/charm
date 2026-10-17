// Component gallery at /dev: every UI component with every variant and state, for checking against Figma on a phone.
import { useState, type ReactNode } from 'react'
import { Avatar } from '../components/Avatar.tsx'
import { mockProfiles } from '../data/mock.ts'
import type { Avatar as AvatarData, HairColor, SkinTone } from '../types.ts'
import {
  Badge,
  BottomNav,
  Button,
  Card,
  CategoryTabs,
  CoinBalance,
  ColorSwatch,
  InterestTag,
  ItemTile,
  ListRow,
  Modal,
  ProgressBar,
  ProgressSteps,
  SegmentedTabs,
  SpeechBubble,
  SPRITES,
  StreakFlame,
  TextField,
  type NavKey,
} from '../components/ui/index.ts'
import styles from './ComponentGallery.module.css'

const AVATAR = '/sprites/samples/charmling.png'
const GATOR_HAT = '/sprites/samples/gator-hat.png'

const HAIR_COLORS = [
  { id: 'brown', label: 'Brown' },
  { id: 'black', label: 'Black' },
  { id: 'gold', label: 'Gold' },
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'green', label: 'Green' },
]

const SKIN_COLORS = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'dark', label: 'Dark' },
]

const AVATAR_SKINS: SkinTone[] = ['pale', 'tan', 'dark']
const AVATAR_HAIR: HairColor[] = ['brown', 'black', 'blonde', 'red', 'blue', 'purple', 'pink', 'green']

const avatar = (overrides: Partial<AvatarData>): AvatarData => ({
  skin: 'pale',
  hairStyle: 1,
  hairColor: 'brown',
  outfit: 'basic-01',
  hat: null,
  accessory: null,
  ...overrides,
})

const AVATAR_COMBOS: Array<{ name: string; avatar: AvatarData }> = [
  { name: 'pale · style 1 · brown · basic-01', avatar: avatar({}) },
  { name: 'dark · style 8 · black · basic-07', avatar: avatar({ skin: 'dark', hairStyle: 8, hairColor: 'black', outfit: 'basic-07' }) },
  { name: 'tan · style 6 · pink · basic-13', avatar: avatar({ skin: 'tan', hairStyle: 6, hairColor: 'pink', outfit: 'basic-13' }) },
  { name: 'pale · style 10 · green · basic-20', avatar: avatar({ hairStyle: 10, hairColor: 'green', outfit: 'basic-20' }) },
  { name: 'dark · style 12 · purple · basic-24', avatar: avatar({ skin: 'dark', hairStyle: 12, hairColor: 'purple', outfit: 'basic-24' }) },
  { name: 'tan · style 4 · blue · basic-16', avatar: avatar({ skin: 'tan', hairStyle: 4, hairColor: 'blue', outfit: 'basic-16' }) },
]

const AVATAR_EDGE_CASES: Array<{ name: string; avatar: AvatarData }> = [
  { name: 'outfit: null', avatar: avatar({ hairStyle: 7, hairColor: 'red', outfit: null }) },
  { name: 'unknown outfit (skipped)', avatar: avatar({ skin: 'tan', outfit: 'special-cape' }) },
  { name: 'unknown hat + accessory (skipped)', avatar: avatar({ skin: 'dark', hat: 'crown', accessory: 'monocle' }) },
  { name: 'bad hairStyle (no base)', avatar: avatar({ hairStyle: 99, outfit: 'basic-09' }) },
]

const SKIN_ORDER: SkinTone[] = ['pale', 'tan', 'dark']
const HAT_IDS = ['beanie', 'blue-cap', 'bucket', 'cowboy', 'cream-cap', 'gator', 'grad-cap', 'red-beanie', 'straw']
const ACCESSORY_IDS = ['blush', 'eyepatch', 'face-paint', 'freckles', 'gator-sunglasses', 'heart-glasses', 'round-glasses', 'sunglasses', 'square-glasses']
const SPECIAL_IDS = ['black-dress', 'flannel', 'hawaiian', 'gym', 'suit', 'astronaut', 'pajamas', 'lab-coat', 'gator-costume']
const HAIR_STYLES_FOR_PARTS = [1, 6, 8, 3, 10, 12, 4, 7, 11]

// Each part on all three skin tones, so mismatches on tan and dark skin are easy to spot.
const partRows = (ids: string[], key: 'hat' | 'accessory' | 'outfit') =>
  ids.map((id, i) => ({
    id,
    avatars: SKIN_ORDER.map((skin) =>
      avatar({
        skin,
        hairStyle: HAIR_STYLES_FOR_PARTS[i],
        hairColor: AVATAR_HAIR[i % AVATAR_HAIR.length],
        outfit: key === 'outfit' ? `special-${id}` : `basic-${String(i * 2 + 1).padStart(2, '0')}`,
        hat: key === 'hat' ? id : null,
        accessory: key === 'accessory' ? id : null,
      }),
    ),
  }))

const HAT_ROWS = partRows(HAT_IDS, 'hat')
const ACCESSORY_ROWS = partRows(ACCESSORY_IDS, 'accessory')
const SPECIAL_ROWS = partRows(SPECIAL_IDS, 'outfit')

const AVATAR_OUTFITS: Array<{ name: string; avatar: AvatarData }> = [
  { name: 'gator hat · gator sunglasses · gator costume', avatar: avatar({ skin: 'tan', hairStyle: 2, hairColor: 'green', outfit: 'special-gator-costume', hat: 'gator', accessory: 'gator-sunglasses' }) },
  { name: 'grad cap · round glasses · suit', avatar: avatar({ skin: 'dark', hairStyle: 9, hairColor: 'black', outfit: 'special-suit', hat: 'grad-cap', accessory: 'round-glasses' }) },
  { name: 'straw hat · heart glasses · hawaiian', avatar: avatar({ skin: 'pale', hairStyle: 7, hairColor: 'blonde', outfit: 'special-hawaiian', hat: 'straw', accessory: 'heart-glasses' }) },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function Variant({ name, children, row = false }: { name: string; children: ReactNode; row?: boolean }) {
  return (
    <div className={styles.variant}>
      <p className={styles.variantName}>{name}</p>
      <div className={row ? styles.row : styles.stack}>{children}</div>
    </div>
  )
}

export default function ComponentGallery() {
  const [interests, setInterests] = useState(['Video Games', 'Action'])
  const [shopTab, setShopTab] = useState<'shop' | 'closet'>('shop')
  const [activityTab, setActivityTab] = useState<'leaderboard' | 'streaks'>('leaderboard')
  const [profileTab, setProfileTab] = useState<'interests' | 'memories'>('interests')
  const [shopCategory, setShopCategory] = useState<'hats' | 'accessories' | 'clothing'>('hats')
  const [closetCategory, setClosetCategory] = useState<'skin' | 'hair' | 'clothing' | 'hats' | 'accessories'>('hats')
  const [buildCategory, setBuildCategory] = useState<'skin' | 'hair' | 'clothing'>('hair')
  const [hair, setHair] = useState('gold')
  const [skin, setSkin] = useState('light')
  const [step, setStep] = useState(1)
  const [greeting, setGreeting] = useState('I love SwampHacks!')
  const [modalOpen, setModalOpen] = useState(false)
  const [nav, setNav] = useState<NavKey>('home')
  const [tile, setTile] = useState('gator')
  const [avatarSkin, setAvatarSkin] = useState<SkinTone>('pale')
  const [avatarHair, setAvatarHair] = useState<HairColor>('brown')
  const [avatarIdle, setAvatarIdle] = useState(true)

  const toggleInterest = (name: string) =>
    setInterests((list) => (list.includes(name) ? list.filter((i) => i !== name) : [...list, name]))

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Components</h1>
      <p className={styles.intro}>Every UI component and state. Pressed states also show while you hold a tap.</p>

      <Section title="Avatar">
        <Variant name="profile size (5x) · idle bob" row>
          <Avatar avatar={AVATAR_COMBOS[0].avatar} idle={avatarIdle} label="Pale, brown hair" />
          <Avatar avatar={AVATAR_COMBOS[1].avatar} idle={avatarIdle} idleOffset={0.5} label="Dark, black hair" />
          <Avatar avatar={AVATAR_COMBOS[2].avatar} idle={avatarIdle} idleOffset={0.25} label="Tan, pink hair" />
        </Variant>
        <Variant name="idle" row>
          <Button size="md" variant="secondary" onClick={() => setAvatarIdle((on) => !on)}>
            {avatarIdle ? 'Stop idle' : 'Start idle'}
          </Button>
        </Variant>
        <Variant name="plaza size (2x) · combinations">
          <div className={styles.avatarGrid}>
            {AVATAR_COMBOS.map(({ name, avatar: a }, i) => (
              <figure key={name} className={styles.avatarCell}>
                <Avatar avatar={a} size="plaza" idle={avatarIdle} idleOffset={i * 0.17} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
        </Variant>
        <Variant name="all 12 hairstyles (pick skin and hair color)">
          <CategoryTabs
            ariaLabel="Skin tone"
            size="sm"
            value={avatarSkin}
            onChange={setAvatarSkin}
            options={AVATAR_SKINS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
          />
          <CategoryTabs
            ariaLabel="Hair color"
            size="sm"
            value={avatarHair}
            onChange={setAvatarHair}
            options={AVATAR_HAIR.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
          />
          <div className={styles.avatarRow}>
            {Array.from({ length: 12 }, (_, i) => (
              <Avatar
                key={i}
                size="plaza"
                idle={avatarIdle}
                idleOffset={i * 0.11}
                avatar={avatar({ skin: avatarSkin, hairColor: avatarHair, hairStyle: i + 1, outfit: `basic-${String((i * 2) % 24 + 1).padStart(2, '0')}` })}
              />
            ))}
          </div>
        </Variant>
        <Variant name="full outfits (profile size)" row>
          {AVATAR_OUTFITS.map(({ name, avatar: a }, i) => (
            <Avatar key={name} avatar={a} idle={avatarIdle} idleOffset={i * 0.3} label={name} />
          ))}
        </Variant>
        {[
          { title: 'hats · pale / tan / dark', rows: HAT_ROWS },
          { title: 'accessories · pale / tan / dark', rows: ACCESSORY_ROWS },
          { title: 'special fits · pale / tan / dark', rows: SPECIAL_ROWS },
        ].map(({ title, rows }) => (
          <Variant key={title} name={title}>
            <div className={styles.partGrid}>
              {rows.map(({ id, avatars }) => (
                <figure key={id} className={styles.partCell}>
                  <div className={styles.partAvatars}>
                    {avatars.map((a) => (
                      <Avatar key={a.skin} avatar={a} size="plaza" idle={false} />
                    ))}
                  </div>
                  <figcaption>{id}</figcaption>
                </figure>
              ))}
            </div>
          </Variant>
        ))}
        <Variant name="missing layers are skipped">
          <div className={styles.avatarGrid}>
            {AVATAR_EDGE_CASES.map(({ name, avatar: a }) => (
              <figure key={name} className={styles.avatarCell}>
                <Avatar avatar={a} size="plaza" idle={false} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
        </Variant>
        <Variant name="mock profiles">
          <div className={styles.avatarGrid}>
            {mockProfiles.map((p) => (
              <figure key={p.id} className={styles.avatarCell}>
                <Avatar avatar={p.avatar} size="plaza" idle={avatarIdle} label={p.nickname} />
                <figcaption>{p.nickname}</figcaption>
              </figure>
            ))}
          </div>
        </Variant>
      </Section>

      <Section title="Button">
        <Variant name="primary · lg (Next, Done)" row>
          <Button>Next</Button>
          <Button data-pressed="">Pressed</Button>
          <Button disabled>Disabled</Button>
        </Variant>
        <Variant name="secondary · lg (Back)" row>
          <Button variant="secondary">Back</Button>
          <Button variant="secondary" data-pressed="">Pressed</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </Variant>
        <Variant name="primary · md / secondary · md" row>
          <Button size="md">Log In</Button>
          <Button size="md" variant="secondary">
            Cancel
          </Button>
          <Button size="md" disabled>
            Disabled
          </Button>
        </Variant>
        <Variant name="footer pair">
          <div className={styles.pair}>
            <Button variant="secondary" fullWidth>
              Back
            </Button>
            <Button fullWidth>Next</Button>
          </div>
        </Variant>
        <Variant name="primary · trailing (Buy)">
          <Button fullWidth trailing={<CoinBalance amount={40} variant="inline" size="lg" />}>
            Buy
          </Button>
          <Button fullWidth disabled trailing={<CoinBalance amount={400} variant="inline" size="lg" />}>
            Buy
          </Button>
        </Variant>
        <Variant name="social">
          <Button variant="social" icon={<img src={SPRITES.google} alt="" />}>
            Continue with Google
          </Button>
          <Button variant="social" icon={<img src={SPRITES.google} alt="" />} data-pressed="">
            Pressed
          </Button>
          <Button variant="social" icon={<img src={SPRITES.google} alt="" />} disabled>
            Disabled
          </Button>
        </Variant>
        <Variant name="pill (Snap a memory)" row>
          <Button variant="pill" icon={<img src={SPRITES.camera} alt="" width={30} height={24} />}>
            Snap a memory
          </Button>
          <Button variant="pill" disabled>
            Disabled
          </Button>
        </Variant>
      </Section>

      <Section title="InterestTag">
        <Variant name="toggle · default / selected (tap them)" row>
          {['Video Games', 'Action', 'Cozy Games', 'Nintendo'].map((name) => (
            <InterestTag
              key={name}
              label={name}
              selected={interests.includes(name)}
              onToggle={() => toggleInterest(name)}
            />
          ))}
        </Variant>
        <Variant name="disabled (limit reached)" row>
          <InterestTag label="Roblox" onToggle={() => {}} disabled />
        </Variant>
        <Variant name="removable (selected strip)" row>
          {interests.map((name) => (
            <InterestTag key={name} label={name} onRemove={() => toggleInterest(name)} />
          ))}
        </Variant>
        <Variant name="display · md / sm" row>
          <InterestTag label="Coffee" selected />
          <InterestTag label="Yoga" />
          <InterestTag label="Matcha" selected size="sm" />
          <InterestTag label="Anime" size="sm" />
        </Variant>
      </Section>

      <Section title="Card">
        <Variant name="cream">
          <Card padding="md">
            <p className={styles.cardHeading}>Your Prompt</p>
            <p className={styles.cardBody}>Would you rather do yoga outside or in a studio?</p>
          </Card>
        </Variant>
        <Variant name="dark">
          <Card variant="dark" padding="md">
            <p className={styles.center}>Charmed since Oct 16.</p>
          </Card>
        </Variant>
        <Variant name="outlined (stat)" row>
          <Card variant="outlined" padding="md" className={styles.stat}>
            <span>Points</span>
            <span className={styles.statValue}>340</span>
          </Card>
          <Card variant="outlined" padding="md" className={styles.stat}>
            <span>Best Streak</span>
            <span className={styles.statValue}>8</span>
          </Card>
        </Variant>
        <Variant name="panel">
          <Card variant="panel" padding="md">
            <p className={styles.cardHeading}>Gator hat</p>
            <p className={styles.cardBody}>Scales on, teeth out. Albert would approve.</p>
          </Card>
        </Variant>
        <Variant name="clickable · default / disabled">
          <Card onClick={() => {}} padding="md">
            <span className={styles.plazaCard}>
              <span>
                <span className={styles.plazaName}>Plaza of the Americas</span>
                <span className={styles.plazaText}>A favorite spot on campus to relax.</span>
              </span>
              <Badge variant="status">Unlocked</Badge>
            </span>
          </Card>
          <Card onClick={() => {}} padding="md" disabled>
            <span className={styles.plazaCard}>
              <span>
                <span className={styles.plazaName}>Century Tower</span>
                <span className={styles.plazaText}>One of UF's most iconic landmarks.</span>
              </span>
              <Badge variant="status">0/40</Badge>
            </span>
          </Card>
        </Variant>
      </Section>

      <Section title="Badge">
        <Variant name="label · sm" row>
          <Badge size="sm">Owned</Badge>
          <Badge size="sm">Trying</Badge>
        </Variant>
        <Variant name="label · md" row>
          <Badge>Trying on</Badge>
          <Badge>Mascot</Badge>
        </Variant>
        <Variant name="status" row>
          <Badge variant="status">Unlocked</Badge>
          <Badge variant="status">0/40</Badge>
        </Variant>
        <Variant name="streak" row>
          <Badge variant="streak">4 day streak</Badge>
        </Variant>
        <Variant name="reward" row>
          <Badge variant="reward">+10 Points</Badge>
          <Badge variant="reward">+5 Coins</Badge>
        </Variant>
      </Section>

      <Section title="Modal / PopUp">
        <Variant name="tap to open" row>
          <Button size="md" onClick={() => setModalOpen(true)}>
            Open pop-up
          </Button>
        </Variant>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Remove tap in?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Remove</Button>
            </>
          }
        >
          Maya tapped in with you today. Removing it takes back the points you both earned.
        </Modal>
      </Section>

      <Section title="StreakFlame">
        <Variant name="orange · sm / md / lg / xl" row>
          <StreakFlame size="sm" />
          <StreakFlame size="md" />
          <StreakFlame size="lg" />
          <StreakFlame size="xl" />
        </Variant>
        <Variant name="dark (on orange)" row>
          <span className={styles.orangeSwatch}>
            <StreakFlame tone="dark" size="sm" />
            <StreakFlame tone="dark" size="md" />
            <StreakFlame tone="dark" size="lg" />
          </span>
        </Variant>
        <Variant name="with count" row>
          <StreakFlame count={5} />
          <StreakFlame count={465} size="lg" />
        </Variant>
      </Section>

      <Section title="TextField">
        <Variant name="md · hidden label (Log In)">
          <TextField label="Username" hideLabel placeholder="Username" size="md" autoComplete="username" />
          <TextField label="Password" hideLabel placeholder="Password" size="md" type="password" autoComplete="current-password" />
        </Variant>
        <Variant name="lg · with label">
          <TextField label="Nickname" defaultValue="Katie Rose" />
          <TextField label="Major" placeholder="Computer Science" />
        </Variant>
        <Variant name="with character count (Greeting)">
          <TextField
            label="Greeting"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            maxLength={30}
            showCount
          />
        </Variant>
        <Variant name="disabled">
          <TextField label="Nickname" defaultValue="Katie Rose" disabled />
        </Variant>
      </Section>

      <Section title="SegmentedTabs">
        <Variant name="pill (Shop / Closet)">
          <SegmentedTabs
            ariaLabel="Shop sections"
            value={shopTab}
            onChange={setShopTab}
            options={[
              { value: 'shop', label: 'Shop' },
              { value: 'closet', label: 'Closet' },
            ]}
          />
        </Variant>
        <Variant name="pill (Leaderboard / Streaks)">
          <SegmentedTabs
            ariaLabel="Activity sections"
            value={activityTab}
            onChange={setActivityTab}
            options={[
              { value: 'leaderboard', label: 'Leaderboard' },
              { value: 'streaks', label: 'Streaks' },
            ]}
          />
        </Variant>
        <Variant name="folder (Interests / Memories)">
          <div>
            <SegmentedTabs
              ariaLabel="Profile sections"
              variant="folder"
              value={profileTab}
              onChange={setProfileTab}
              options={[
                { value: 'interests', label: 'Interests' },
                { value: 'memories', label: 'Memories' },
              ]}
            />
            <div className={styles.folderPanel}>
              {profileTab === 'interests' ? (
                <div className={styles.row}>
                  <InterestTag label="Anime" selected size="sm" />
                  <InterestTag label="Matcha" selected size="sm" />
                  <InterestTag label="Coffee" selected size="sm" />
                </div>
              ) : (
                <p>Memories go here.</p>
              )}
            </div>
          </div>
        </Variant>
        <Variant name="disabled option">
          <SegmentedTabs
            ariaLabel="Disabled example"
            value="shop"
            onChange={() => {}}
            options={[
              { value: 'shop', label: 'Shop' },
              { value: 'closet', label: 'Closet', disabled: true },
            ]}
          />
        </Variant>
      </Section>

      <Section title="CategoryTabs">
        <Variant name="md (Shop)">
          <CategoryTabs
            ariaLabel="Shop categories"
            value={shopCategory}
            onChange={setShopCategory}
            options={[
              { value: 'hats', label: 'Hats' },
              { value: 'accessories', label: 'Accessories' },
              { value: 'clothing', label: 'Clothing' },
            ]}
          />
        </Variant>
        <Variant name="sm (Closet)">
          <CategoryTabs
            ariaLabel="Closet categories"
            size="sm"
            value={closetCategory}
            onChange={setClosetCategory}
            options={[
              { value: 'skin', label: 'Skin' },
              { value: 'hair', label: 'Hair' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'hats', label: 'Hats' },
              { value: 'accessories', label: 'Accessories' },
            ]}
          />
        </Variant>
        <Variant name="lg (Build your Charmling) · with disabled">
          <CategoryTabs
            ariaLabel="Charmling parts"
            size="lg"
            value={buildCategory}
            onChange={setBuildCategory}
            options={[
              { value: 'skin', label: 'Skin' },
              { value: 'hair', label: 'Hair' },
              { value: 'clothing', label: 'Clothing', disabled: true },
            ]}
          />
        </Variant>
      </Section>

      <Section title="ProgressSteps">
        <Variant name={`step ${step} of 5 (tap to advance)`}>
          <button type="button" className={styles.plainButton} onClick={() => setStep((s) => (s % 5) + 1)}>
            <ProgressSteps current={step} />
          </button>
        </Variant>
        <Variant name="all steps">
          {[1, 2, 3, 4, 5].map((n) => (
            <ProgressSteps key={n} current={n} />
          ))}
        </Variant>
      </Section>

      <Section title="ProgressBar">
        <Variant name="in progress">
          <ProgressBar value={18} max={25} valueLabel="18/25 Charmlings" endLabel="Lake Alice" />
        </Variant>
        <Variant name="empty / full">
          <ProgressBar value={0} max={10} valueLabel="0/10 Charmlings" endLabel="Turlington" />
          <ProgressBar value={50} max={50} valueLabel="50/50 Charmlings" endLabel="The Swamp" />
        </Variant>
      </Section>

      <Section title="CoinBalance">
        <Variant name="boxed (header)" row>
          <CoinBalance amount={300} />
          <CoinBalance amount={1250} />
        </Variant>
        <Variant name="inline · md / lg" row>
          <span className={styles.creamSwatch}>
            <CoinBalance amount={50} variant="inline" />
            <CoinBalance amount={40} variant="inline" size="lg" />
          </span>
        </Variant>
      </Section>

      <Section title="ColorSwatch">
        <Variant name="md · hair (tap to select)">
          <div className={styles.swatchGrid}>
            {HAIR_COLORS.map((c) => (
              <ColorSwatch
                key={c.id}
                color={`var(--swatch-hair-${c.id})`}
                label={c.label}
                selected={hair === c.id}
                onSelect={() => setHair(c.id)}
              />
            ))}
          </div>
        </Variant>
        <Variant name="lg · skin" row>
          {SKIN_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              size="lg"
              color={`var(--swatch-skin-${c.id})`}
              label={c.label}
              selected={skin === c.id}
              onSelect={() => setSkin(c.id)}
            />
          ))}
        </Variant>
        <Variant name="disabled (locked) / sm display" row>
          <ColorSwatch color="var(--swatch-hair-green)" label="Green, locked" onSelect={() => {}} disabled />
          <ColorSwatch color="var(--swatch-skin-light)" label="Light" size="sm" />
        </Variant>
      </Section>

      <Section title="SpeechBubble">
        <Variant name="next to an avatar">
          <div className={styles.bubbleScene}>
            <img className={styles.bubbleAvatar} src={AVATAR} alt="" />
            <SpeechBubble>{greeting || 'Hi!'}</SpeechBubble>
          </div>
        </Variant>
        <Variant name="long greeting wraps">
          <SpeechBubble>Ask me about any fantasy book you've read lately</SpeechBubble>
        </Variant>
      </Section>

      <Section title="ListRow">
        <Variant name="leaderboard · default / highlighted (you)">
          <ListRow rank={1} name="Blake" avatarSrc={AVATAR} value="60 pts" />
          <ListRow rank={2} name="Mike" avatarSrc={AVATAR} value="50 pts" />
          <ListRow rank={3} name="You" avatarSrc={AVATAR} value="40 pts" highlighted />
        </Variant>
        <Variant name="streak · highlighted / default">
          <ListRow name="Ariana" avatarSrc={AVATAR} streak={2} highlighted />
          <ListRow name="Katie" avatarSrc={AVATAR} streak={5} />
        </Variant>
        <Variant name="clickable">
          <ListRow name="Cata" avatarSrc={AVATAR} streak={4} onClick={() => {}} />
        </Variant>
      </Section>

      <Section title="ItemTile">
        <Variant name="shop · trying (selected) / default / owned / can't afford">
          <div className={styles.tileGrid}>
            <ItemTile
              name="Gator hat"
              imageSrc={GATOR_HAT}
              price={50}
              badge={tile === 'gator' ? 'trying' : undefined}
              selected={tile === 'gator'}
              onSelect={() => setTile('gator')}
            />
            <ItemTile
              name="Cowboy hat"
              imageSrc={GATOR_HAT}
              price={40}
              badge={tile === 'cowboy' ? 'trying' : undefined}
              selected={tile === 'cowboy'}
              onSelect={() => setTile('cowboy')}
            />
            <ItemTile name="Beanie" imageSrc={GATOR_HAT} price={20} badge="owned" onSelect={() => {}} />
            <ItemTile name="Graduation hat" imageSrc={GATOR_HAT} price={600} disabled />
          </div>
        </Variant>
        <Variant name="closet · empty / worn (selected) / default">
          <div className={styles.tileGrid}>
            <ItemTile name="No hat" empty onSelect={() => {}} />
            <ItemTile name="Cream Cap" imageSrc={GATOR_HAT} selected onSelect={() => {}} />
            <ItemTile name="Bucket Hat" imageSrc={GATOR_HAT} onSelect={() => {}} />
          </div>
        </Variant>
      </Section>

      <Section title="BottomNav">
        <Variant name={`active: ${nav} (tap to switch)`}>
          <BottomNav active={nav} onSelect={setNav} />
        </Variant>
      </Section>
    </main>
  )
}
