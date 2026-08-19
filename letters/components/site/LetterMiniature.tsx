/**
 * The signature visual: a finished letter as a crisp A4 miniature, with the
 * parts that came from form fields tinted in the primary.
 *
 * It answers the only question the landing page has to answer — what does
 * filling this form actually give me — without a screenshot, a mockup or a
 * word of salesmanship.
 */
const FILLED = "rgba(29, 129, 242, 0.3)";

function Filled({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ backgroundColor: FILLED, borderRadius: 2, padding: "0 2px" }}>
      {children}
    </span>
  );
}

export function LetterMiniature() {
  return (
    <figure className="m-0">
      <div
        className="w-[248px] overflow-hidden rounded-[4px] border border-line bg-white sm:w-[280px]"
        style={{ aspectRatio: "210 / 297" }}
      >
        <div
          className="h-full text-[6.5px] leading-[1.6] text-[#111111] sm:text-[7px]"
          style={{ padding: "11.9%" }}
        >
          <div className="mb-2 text-right">
            <div><Filled>Sana Iqbal</Filled></div>
            <div><Filled>48 Bramley Court</Filled></div>
            <div><Filled>Manchester M14 6FT</Filled></div>
          </div>
          <div className="mb-2">
            <div><Filled>The Visa Section</Filled></div>
            <div><Filled>British High Commission</Filled></div>
          </div>
          <div className="mb-2">18 August 2026</div>
          <div className="mb-2 font-semibold">
            Invitation to visit, for <Filled>Nadia Iqbal</Filled>
          </div>
          <div className="mb-2">Dear Sir or Madam,</div>
          <p className="mb-2">
            I am <Filled>Sana Iqbal</Filled>, <Filled>a permanent resident of this
            country</Filled>, and I would like to invite <Filled>my mother</Filled>,{" "}
            <Filled>Nadia Iqbal</Filled>, to visit me.
          </p>
          <p className="mb-2">
            The visit is planned from <Filled>4 November 2026</Filled> to{" "}
            <Filled>25 November 2026</Filled>, 21 nights in total,{" "}
            <Filled>to be with me for the birth of my first child</Filled>.
          </p>
          <p className="mb-2">
            She will stay at my home for the whole of the visit, at no cost to
            her. <Filled>I will be responsible for the costs of this visit</Filled>.
          </p>
          <div className="mt-3">Yours faithfully,</div>
          <div className="h-3" />
          <div><Filled>Sana Iqbal</Filled></div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-[280px] text-[12px] text-text-light">
        Everything tinted came from a form field. The rest is the template doing
        the work. Invented names.
      </figcaption>
    </figure>
  );
}
