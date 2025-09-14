import { Node, defaultBlockAt, mergeAttributes } from "@tiptap/core";
import { selectParentNode } from "@tiptap/core/dist/commands";
import { Selection } from "@tiptap/pm/state";

export interface DetailsSummaryOptions {
  HTMLAttributes: Record<string, any>;
}

export const DetailsSummary = Node.create<DetailsSummaryOptions>({
  name: "detailsSummary",
  group: "block",
  content: "heading | paragraph",
  defining: true,
  isolating: true,
  selectable: false,
  addAttributes() {
    return {
      level: {
        default: 0,
        parseHTML: (e) => e.getAttribute("data-level") ? parseInt(e.getAttribute("data-level") || "0", 10) : 0,
        renderHTML: (a) => (a.level ? { "data-level": a.level } : {}),
      },
    };
  },
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  parseHTML() {
    return [
      {
        tag: "summary",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "summary",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ];
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const state = editor.state;
        const selection = state.selection;
        const anchor = selection.$anchor;
        if (!anchor || anchor.depth < 1) {
          return false;
        }
        const parent = selection.$anchor.node(selection.$anchor.depth - 1);
        if (parent.type.name !== this.name) {
          return false;
        }
        if (anchor.parentOffset !== 0) {
          return false;
        }
        return editor.chain().unsetDetails().focus().run();
      },
      Enter: ({ editor }) => {
        const view = editor.view;
        const state = editor.state;

        const head = state.selection.$head;
        if (head.node(head.depth - 1).type.name !== this.name) {
          return false;
        }

        const hasOffset =
          // @ts-ignore
          view.domAtPos(head.after() + 2).node.offsetParent !== null;
        const findNode = hasOffset
          ? state.doc.nodeAt(head.after() + 1)
          : head.node(-3);
        if (!findNode) {
          return false;
        }

        const indexAfter = hasOffset ? 0 : head.indexAfter(-2);
        const nodeType = defaultBlockAt(findNode.contentMatchAt(indexAfter));
        if (
          !nodeType ||
          !findNode.canReplaceWith(indexAfter, indexAfter, nodeType)
        ) {
          return false;
        }

        const defaultNode = nodeType.createAndFill();
        if (!defaultNode) {
          return false;
        }

        const tr = state.tr;
        const after = hasOffset ? head.after() + 2 : head.after(-2);
        tr.replaceWith(after, after, defaultNode);
        tr.setSelection(Selection.near(tr.doc.resolve(after), 1));

        tr.scrollIntoView();
        view.dispatch(tr);

        return true;
      },
    };
  },
});
