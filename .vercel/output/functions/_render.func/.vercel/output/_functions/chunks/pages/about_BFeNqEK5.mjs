import { c as createAstro, d as createComponent, r as renderTemplate, h as renderComponent, m as maybeRenderHead, f as renderSlot, u as unescapeHTML } from '../astro_BOFBhy_c.mjs';
import 'kleur/colors';
import { S as SITE, c as $$Layout, a as $$Header, b as $$Footer } from './404_BIx6mPod.mjs';
import { $ as $$Breadcrumbs } from './_page__C0rZWHuM.mjs';

const $$Astro = createAstro("https://gaazeon.com/");
const $$AboutLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AboutLayout;
  const { frontmatter } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${frontmatter.title} | ${SITE.title}` }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "activeNav": "about" })} ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {})} ${maybeRenderHead()}<main id="main-content"> <section id="about" class="prose mb-28 max-w-3xl prose-img:border-0"> <h1 class="text-2xl tracking-wider sm:text-3xl">${frontmatter.title}</h1> ${renderSlot($$result2, $$slots["default"])} </section> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/leojun/AstroPaper-blog/src/layouts/AboutLayout.astro", void 0);

const html = "<p>Welcome to my blog!</p>\n<p>I am passionate about sharing my knowledge and experiences in the field of software development. Here, you will find a collection of articles and tutorials on various topics related to programming, web development, and technology.</p>\n<p>Feel free to explore the different sections of my blog and dive into the articles that interest you the most. If you have any questions or suggestions, please don’t hesitate to reach out to me.</p>\n<p>Happy reading!</p>\n<div>\n  <img src=\"/assets/dev.svg\" class=\"sm:w-1/2 mx-auto\" alt=\"coding dev illustration\">\n</div>";

				const frontmatter = {"layout":"../layouts/AboutLayout.astro","title":"About"};
				const file = "/Users/leojun/AstroPaper-blog/src/pages/about.md";
				const url = "/about";
				function rawContent() {
					return "\nWelcome to my blog!\n\nI am passionate about sharing my knowledge and experiences in the field of software development. Here, you will find a collection of articles and tutorials on various topics related to programming, web development, and technology.\n\nFeel free to explore the different sections of my blog and dive into the articles that interest you the most. If you have any questions or suggestions, please don't hesitate to reach out to me.\n\nHappy reading!\n\n<div>\n  <img src=\"/assets/dev.svg\" class=\"sm:w-1/2 mx-auto\" alt=\"coding dev illustration\">\n</div>\n";
				}
				function compiledContent() {
					return html;
				}
				function getHeadings() {
					return [];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${renderComponent(result, 'Layout', $$AboutLayout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => renderTemplate`${unescapeHTML(html)}`
							})}`;
				});

export { Content, compiledContent, Content as default, file, frontmatter, getHeadings, rawContent, url };
