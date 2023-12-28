import slugify from 'slugify';

/** @typedef {{level: number, id: string, title: string: children?: Heading[]}} Heading */

/* eslint no-useless-escape: 0 */
const helpers = {
  isValidUrl: (string) => {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
  },
  /**
   * @param {string} string
   * @param {{[key: string]: boolean}} options
   * @returns {string}
   */
  removeMarkdown: (string, options) => {
    options = options || {
      stripListLeaders: true,
      listUnicodeChar: true,
      gfm: true,
      useImgAltText: true,
    };
    string = string.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '');

    try {
      if (options.stripListLeaders) {
        if (options.listUnicodeChar)
          string = string.replace(
            /^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm,
            options.listUnicodeChar + ' $1',
          );
        else string = string.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1');
      }
      if (options.gfm) {
        string = string
          // Header
          .replace(/\n={2,}/g, '\n')
          // Fenced codeblocks
          .replace(/~{3}.*\n/g, '')
          // Strikethrough
          .replace(/~~/g, '')
          // Fenced codeblocks
          .replace(/`{3}.*\n/g, '');
      }
      string = string
        // Remove headers
        .replace(/#/g, '')
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove setext-style headers
        .replace(/^[=\-]{2,}\s*$/g, '')
        // Remove footnotes?
        .replace(/\[\^.+?\](\: .*?$)?/g, '')
        .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
        // Remove images
        .replace(
          /\!\[(.*?)\][\[\(].*?[\]\)]/g,
          options.useImgAltText ? '$1' : '',
        )
        // Remove inline links
        .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
        // Remove blockquotes
        .replace(/^\s{0,3}>\s?/g, '')
        // Remove reference-style links?
        .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
        // Remove atx-style headers
        .replace(
          /^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm,
          '$1$2$3',
        )
        // Remove emphasis (repeat the line to remove double emphasis)
        .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
        .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
        // Remove code blocks
        .replace(/(`{3,})(.*?)\1/gm, '$2')
        // Remove inline code
        .replace(/`(.+?)`/g, '$1')
        // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
        .replace(/\n{2,}/g, '\n\n')
        // Remove double spaces
        .replace(/\s+/g, ' ');
    } catch (e) {
      console.error(e);
    }
    return string;
  },

  /**
   * @param {string} path
   * @returns {string}
   */
  getCanonical: (path) =>
    new URL(path, process.env.NEXT_PUBLIC_SITE).toString(),

  getPostSlug: (slug) => `/blog/${slug}`,
  getCustomerStorySlug: (slug) => `/customers/${slug}`,
  getCustomerStoriesPerPage: () => {
    return 9;
  },

  getPostDate: (date) => {
    const d = new Date(date || 'Dec 27, 2022');

    return `${d
      .toLocaleString('en-US', { month: 'long' })
      .substring(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  },

  getPostPerPage: () => {
    return 12;
  },
  /**
   * Generates slug from string
   * @param {string} str
   * @returns {string}
   */
  slugify: (str) =>
    slugify(str, {
      lower: true,
      strict: true,
      locale: 'en',
    }),
  /**
   * Takes Markdown and demotes headings if there's a Heading level 1 (`<h1>`)
   * @param {string} str
   * @returns {string}
   */
  demoteHeadings: (str = '') => {
    const h1Match = str.match(/^#\s/gm);
    const hasH1 = h1Match ? h1Match.length > 0 : false;
    return hasH1 ? str.replaceAll(/^#{1,5}\s/gm, (m) => '#' + m) : str;
  },
  /**
   * Trims text to defined length and adds appropriate ellipses
   * @param {string} str
   * @param {number} length Defaults to 160
   * @returns {string}
   */
  trimText: (str, length = 160) => {
    if (str.length > length) {
      str = str.substring(0, length - 3) + '...';
    }
    return str;
  },
  /**
   * @param {string} md
   * @returns {Heading[]}
   */
  generateHeadings: (md = '') => {
    /** @type {Heading[]} */
    const headings = [];
    const headingsParsed = md
      .split('\n')
      .filter((line) => line.match(/^#{1,3}\s/));

    for (const line of headingsParsed) {
      const [, level, title] = line.match(/^(#{1,3})\s(.*)/);
      const heading = {
        level: level.length,
        id: helpers.slugify(title),
        title,
      };

      if (heading.level === 1 || heading.level === 2) {
        headings.push({ ...heading, children: [] });
      } else if (heading.level === 3 && headings.length === 0) {
        headings.push({ children: [heading] });
      } else if (heading.level === 3) {
        headings[headings.length - 1].children.push(heading);
      }
    }

    return headings;
  },
  injectCtaToMarkdown: (md = '') => {
    const blocks = md.split('\n');

    const cta1Index = blocks.findIndex((block) => {
      return block === '<!-- cta-1 -->';
    });

    if (cta1Index !== -1) {
      blocks.splice(cta1Index, 1, '<amplicationcta1></amplicationcta1>');
    }

    const cta2Index = blocks.findIndex((block) => {
      return block === '<!-- cta-2 -->';
    });

    if (cta2Index !== -1) {
      blocks.splice(cta2Index, 1, '<amplicationcta2></amplicationcta2>');
    }

    if (cta1Index === -1 && cta2Index === -1) {
      const prefix = '## ';
      let count = 0;
      let index = -1;

      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].startsWith(prefix)) {
          count++;
          if (count === 2) {
            index = i;
            break;
          }
        }
      }

      blocks.splice(index, 0, '<amplicationcta1></amplicationcta1>');
    }

    return blocks.join('\n');
  },
  getInitials: (string) => {
    const names = string.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();

    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  },
};

export default helpers;
