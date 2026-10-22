/* Run after building the shared and api workspaces. Uses and removes its own temporary database. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const mariadb = require('mariadb');
const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { ValidationPipe } = require('@nestjs/common');
const cookieParser = require('cookie-parser');

const database = `retro_org_test_${randomUUID().replaceAll('-', '')}`;
process.env.DATABASE_NAME = database;
process.env.JWT_SECRET = randomUUID();
process.env.NODE_ENV = 'test';
const rootOptions = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: Number(process.env.DATABASE_PORT || 3307),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'retro',
  multipleStatements: true,
};
const compiled = (path) => require(join(__dirname, '../dist/src', path));
const { PrismaService } = compiled('prisma/prisma.service');
const { TeamService } = compiled('team/team.service');
const { TeamController } = compiled('team/application/team.controller');
const { OrganizationService } = compiled('organization/organization.service');
const { OrganizationController } = compiled('organization/organization.controller');
const { UserController } = compiled('user/application/user.controller');
const { AuthController } = compiled('auth/auth.controller');
const { AuthService } = compiled('auth/auth.service');
const { JwtStrategy } = compiled('auth/jwt/jwt.strategy');
const { AuthAbilityFactory } = compiled('auth/auth.ability');
const { RetroGateway } = compiled('retro/application/retro.gateway');
const { ForbiddenExceptionFilter } = compiled('common/ForbiddenExceptionFilter');
const { NotFoundExceptionFilter } = compiled('common/NotFoundExceptionFilter');
const { isAllowedOrigin } = compiled('auth/session');

async function main() {
  const root = await mariadb.createConnection(rootOptions);
  let prisma;
  let app;
  try {
    await root.query(`CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await root.query(`USE ${database}`);
    const migrations = join(__dirname, '../prisma/migrations');
    for (const folder of readdirSync(migrations).sort()) {
      if (!/^\d/.test(folder)) continue;
      if (folder === '20261006120000_organizations') {
        await root.query("INSERT INTO Team (id, name) VALUES ('legacy-team', 'Zespół Żółć Łódź')");
      }
      await root.query(readFileSync(join(migrations, folder, 'migration.sql'), 'utf8'));
    }
    prisma = new PrismaService();
    await prisma.$connect();
    const legacy = await prisma.team.findUniqueOrThrow({ where: { id: 'legacy-team' } });
    assert.equal(legacy.organization_id, null);
    assert.equal(legacy.slug, 'zespol-zolc-lodz');
    const owner = await prisma.user.create({ data: { nick: 'Owner', email: 'owner@org.test', google_id: 'owner', avatar_link: '' } });
    const member = await prisma.user.create({ data: { nick: 'Member', email: 'member@org.test', google_id: 'member', avatar_link: '' } });
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    const token = (user) => jwt.sign({ user }, { expiresIn: '30d' });
    const module = await Test.createTestingModule({
      controllers: [TeamController, OrganizationController, UserController, AuthController],
      providers: [TeamService, OrganizationService, AuthService, JwtStrategy, AuthAbilityFactory,
        { provide: PrismaService, useValue: prisma }, { provide: JwtService, useValue: jwt },
        { provide: RetroGateway, useValue: { handleTeamDeleted: async () => {} } }],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/rest/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new ForbiddenExceptionFilter(), new NotFoundExceptionFilter());
    app.enableCors({ origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)), credentials: true });
    await app.listen(0, '127.0.0.1');
    const base = `${await app.getUrl()}/api/rest/v1/`;
    const ownerToken = token(owner);
    const memberToken = token(member);
    async function api(method, path, body, auth = ownerToken, expected = 200, extraHeaders = {}) {
      const response = await fetch(base + path, { method, headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders,
      }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const text = await response.text();
      assert.equal(response.status, expected, `${method} ${path}: ${text}`);
      return { data: text ? JSON.parse(text) : null, response };
    }
    const org = (await api('POST', 'organizations', { name: 'Example', slug: 'example' }, ownerToken, 201)).data;
    assert.equal(org.role, 'OWNER');
    await api('POST', 'organizations', { name: 'Duplicate', slug: 'example' }, ownerToken, 409);
    await api('POST', 'organizations', { name: 'Reserved', slug: 'www' }, ownerToken, 400);
    await api('GET', `organizations/${org.id}`, null, memberToken, 403);
    const created = await Promise.all(Array.from({ length: 4 }, () => api('POST', 'teams', { name: 'Zespół Łódź', organization_id: org.id }, ownerToken, 201)));
    assert.deepEqual(created.map((item) => item.data.slug).sort(), ['zespol-lodz', 'zespol-lodz-2', 'zespol-lodz-3', 'zespol-lodz-4']);
    const team = created.find((item) => item.data.slug === 'zespol-lodz').data;
    await api('GET', `teams/resolve/example/${team.slug}`);
    await api('PUT', `organizations/${org.id}/members`, { email: member.email, role: 'USER' });
    const memberOrg = (await api('GET', `organizations/${org.id}`, null, memberToken)).data;
    assert.equal(memberOrg.teams.length, 0);
    assert.equal(memberOrg.members.length, 0);
    await api('GET', `teams/resolve/example/${team.slug}`, null, memberToken, 403);
    await api('POST', 'teams', { name: 'Unauthorized', organization_id: org.id }, memberToken, 403);
    const org2 = (await api('POST', 'organizations', { name: 'Second', slug: 'second' }, ownerToken, 201)).data;
    await api('POST', 'teams', { name: 'Zespół Łódź', organization_id: org2.id }, ownerToken, 201);
    const moved = (await api('PUT', `teams/${team.id}`, { name: team.name, organization_id: org2.id })).data;
    assert.equal(moved.slug, 'zespol-lodz-2');
    const renamed = (await api('PUT', `teams/${team.id}`, { name: 'Renamed' })).data;
    assert.equal(renamed.slug, moved.slug);
    await api('GET', `teams/resolve/second/${renamed.slug}`);
    await api('GET', `teams/resolve/example/${team.slug}`, null, ownerToken, 404);
    const foreignOrg = (await api('POST', 'organizations', { name: 'Foreign', slug: 'foreign' }, memberToken, 201)).data;
    await api('PUT', `teams/${team.id}`, { name: team.name, organization_id: foreignOrg.id }, ownerToken, 403);
    await prisma.teamUsers.create({ data: { team_id: team.id, user_id: member.id, role: 'ADMIN' } });
    await api('PUT', `teams/${team.id}`, { name: team.name, organization_id: foreignOrg.id }, memberToken, 403);
    await api('PUT', `organizations/${org.id}/members`, { email: owner.email, role: 'ADMIN' }, ownerToken, 403);
    await api('DELETE', `organizations/${org.id}/members/${owner.id}`, null, ownerToken, 400);
    await api('PUT', `teams/${team.id}`, { name: 'Standalone', organization_id: null });
    const standalone = await Promise.all([api('POST', 'teams', { name: 'Same' }, ownerToken, 201), api('POST', 'teams', { name: 'Same' }, ownerToken, 201)]);
    assert.ok(standalone.every(({ data }) => data.organization_id === null));
    const me = (await api('GET', 'users/@me')).data;
    assert.equal(me.organizations.length, 2);
    const migrated = await api('POST', 'google/session', null, ownerToken, 201);
    const cookie = migrated.response.headers.get('set-cookie');
    assert.ok(cookie.includes('HttpOnly'));
    const session = await api('GET', 'google/session', null, null, 200, { Cookie: cookie.split(';')[0], Origin: 'https://example.retromachine.eu' });
    assert.ok(session.data.access_token);
    assert.equal(session.response.headers.get('access-control-allow-origin'), 'https://example.retromachine.eu');
    assert.equal(session.response.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(session.response.headers.get('cache-control'), 'no-store');
    await api('GET', 'google/session', null, null, 401, { Cookie: cookie.split(';')[0], Origin: 'https://evil.test' });
    const logout = await api('POST', 'google/logout', null, null, 204);
    assert.ok(logout.response.headers.get('set-cookie').includes('retro_session=;'));
    if (process.argv.includes('--browser')) { await verifyBrowser(base, ownerToken); await verifyBrowser(base, ownerToken, true); }
    console.log('Organization integration passed: migrations, legacy data, concurrent slugs, transfer, permissions, session and CORS.');
  } finally {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    await root.query(`DROP DATABASE IF EXISTS ${database}`);
    await root.end();
  }
}

async function verifyBrowser(apiBase, token, local = false) {
  const rootOrigin = local ? 'http://localhost:8080' : 'https://retromachine.eu';
  const slug = local ? 'local-browser' : 'browser';
  const organizationName = local ? 'Local Organization' : 'Browser Organization';
  const teamName = local ? 'Lokalny zespół' : 'Zespół przeglądarki';
  const teamSlug = local ? 'lokalny-zespol' : 'zespol-przegladarki';
  const organizationOrigin = local ? `http://${slug}.localhost:8080` : `https://${slug}.retromachine.eu`;
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(local ? {
      storageState: { cookies: [], origins: [{ origin: rootOrigin, localStorage: [{ name: 'Bearer', value: token }] }] },
    } : {});
    if (!local) await context.addCookies([{ name: 'retro_session', value: token, domain: 'retromachine.eu', path: '/api/rest/v1', httpOnly: true, secure: true, sameSite: 'Lax' }]);
    const dist = join(__dirname, '../../web/dist');
    const contentTypes = { '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.html': 'text/html' };
    const { extname } = require('node:path');
    await context.route(local ? /^http:\/\/(?:[a-z0-9-]+\.)?localhost:(?:8080|3000|3001)\// : /^https:\/\/(?:[a-z0-9-]+\.)?retromachine\.eu\//, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/rest/v1/')) {
        if (url.pathname.includes('/notifications/')) {
          return route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' });
        }
        const response = await route.fetch({ url: apiBase + url.pathname.slice('/api/rest/v1/'.length) + url.search, ...(local ? { headers: { ...route.request().headers(), host: 'localhost:3000' } } : {}) });
        return route.fulfill({ response });
      }
      if (url.pathname.startsWith('/socket.io/')) return route.fulfill({ status: 503, body: '' });
      const asset = url.pathname.startsWith('/assets/') ? url.pathname.slice(1) : 'index.html';
      return route.fulfill({ status: 200, contentType: contentTypes[extname(asset)] || 'application/octet-stream', body: local && asset.endsWith('.js') ? readFileSync(join(dist, asset), 'utf8').replaceAll('https://retromachine.eu/api/rest/v1/', 'http://localhost:3000/api/rest/v1/').replaceAll('https://retromachine.eu', 'http://localhost:3001') : readFileSync(join(dist, asset)) });
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${rootOrigin}/organizations/create`);
    await page.getByLabel('Nazwa organizacji').fill(organizationName);
    await page.getByLabel('Subdomena').fill(slug);
    await page.getByRole('button', { name: 'Stwórz organizację', exact: true }).click();
    await page.getByRole('button', { name: 'Stwórz zespół', exact: true }).waitFor();
    await page.getByLabel('Dodaj członka — adres e-mail').fill('member@org.test');
    await page.getByRole('button', { name: 'Dodaj członka', exact: true }).click();
    await page.getByRole('button', { name: 'Nadaj administratora', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Stwórz zespół', exact: true }).click();
    await page.getByTestId('team-name').fill(teamName);
    await page.getByTestId('save-team').click();
    await page.waitForURL(`${rootOrigin}/`);
    await page.getByTestId(`team-${teamName}`).waitFor();
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('menuitem').filter({ hasText: organizationName }).click();
    await page.waitForURL(`${organizationOrigin}/`);
    await page.getByRole('link', { name: teamName, exact: true }).waitFor();
    if (!local) await page.screenshot({ path: require('node:path').join(require('node:os').tmpdir(), 'retromachina-organization-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    if (!local) await page.screenshot({ path: require('node:path').join(require('node:os').tmpdir(), 'retromachina-organization-mobile.png'), fullPage: true });
    await page.getByRole('link', { name: teamName, exact: true }).click();
    await page.waitForURL(`${organizationOrigin}/${teamSlug}`);
    await page.getByTestId(`team-${teamName}`).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('Bearer')), null);
    await page.reload();
    await page.getByTestId(`team-${teamName}`).waitFor();
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('menuitem', { name: 'Wyloguj', exact: true }).click();
    await page.waitForURL(`${organizationOrigin}/signin`);
    await page.goto(`${rootOrigin}/`);
    await page.waitForURL(`${rootOrigin}/hero`);
    assert.deepEqual(pageErrors, []);
    console.log(local ? 'Local browser integration passed: legacy token migration and shared session on localhost subdomains.' : 'Browser integration passed: organization and team forms, Navbar, subdomain routing, shared cookie restore, refresh and logout.');
  } finally {
    for (const context of browser.contexts()) await context.unrouteAll({ behavior: "wait" });
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
