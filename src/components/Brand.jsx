/** This function is used for displaying the Threadline wordmark and its home link. */
export default function Brand({ onClick }) {
  return (
    <a
      className="brand"
      href="/"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onClick();
      }}
    >
      THREAD<span>LINE</span>
      <i>.</i>
    </a>
  );
}
