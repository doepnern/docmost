import { Node, defaultBlockAt, mergeAttributes } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";

export interface DetailsSummaryOptions {
  HTMLAttributes: Record<string, any>;
}

export const DetailsSummary = Node.create<DetailsSummaryOptions>({
  name: "detailsSummary",
  group: "block",
  content: "inline*",
  defining: true,
  isolating: true,
  selectable: false,
  priority: 101,
  addAttributes() {
    return {
      level: {
        default: 0,
        rendered: false,
      },
    };
  },
  addOptions() {
    return {
      levels: [0, 1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    };
  },
  parseHTML() {
    return [
      {
        tag: "summary",
        attrs: { level: 0 },
        ["data-type"]: this.name
      },
      ...[1, 2, 3, 4, 5, 6].map((level) => ({ tag: `h${level}`, attrs: { level }, ["data-type"]: this.name })),
    ];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      node.attrs.level === 0 ? "summary" : "h" + node.attrs.level,
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0
    ];
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const state = editor.state;
        const selection = state.selection;
        if (selection.$anchor.parent.type.name !== this.name) {
          return false;
        }
        if (selection.$anchor.parentOffset !== 0) {
          return false;
        }
        return editor.chain().unsetDetails().focus().run();
      },
      Enter: ({ editor }) => {
        const view = editor.view;
        const state = editor.state;

        const head = state.selection.$head;
        if (head.parent.type.name !== this.name) {
          return false;
        }

        const hasOffset =
          // @ts-ignore
          view.domAtPos(head.after() + 1).node.offsetParent !== null;
        const findNode = hasOffset
          ? state.doc.nodeAt(head.after())
          : head.node(-2);
        if (!findNode) {
          return false;
        }

        const indexAfter = hasOffset ? 0 : head.indexAfter(-1);
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
        const after = hasOffset ? head.after() + 1 : head.after(-1);
        tr.replaceWith(after, after, defaultNode);
        tr.setSelection(Selection.near(tr.doc.resolve(after), 1));

        tr.scrollIntoView();
        view.dispatch(tr);

        return true;
      },
    };
  },
});
