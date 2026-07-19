# Critical Literature Evaluation: Distributed File Systems

**Course:** Distributed Computing  
**Author:** Adeesha Wijayasiri  

---

## Abstract

Distributed file systems (DFS) extend the familiar abstraction of files and directories across networked machines, enabling shared persistence, collaboration, and scale beyond what a single host can provide. This survey critically evaluates several influential systems—Sun Network File System (NFS), Andrew File System (AFS), Coda, Google File System (GFS), and Hadoop Distributed File System (HDFS)—against core design requirements drawn from classical distributed systems literature (Coulouris et al., Tanenbaum & van Steen) and contemporary large-scale practice. Rather than treating these systems as interchangeable “remote disks,” the analysis highlights how each design reflects explicit trade-offs among transparency, mobility, performance, simplicity, scalability, availability, reliability, data integrity, security, and heterogeneity. The conclusion argues that no single DFS optimally satisfies all criteria; suitability depends on workload, failure model, and consistency expectations.

---

## 1. Introduction

In centralized systems, a file system maps disk blocks to named files, enforces access control, and guarantees durability after successful writes. A distributed file system preserves this programming model while allowing processes on different machines to share data over long periods in a secure and reliable manner (Coulouris et al.). The ideal file service, as described in course materials, should make remote files appear as accessible as local ones—ideally with comparable performance and, in some deployments, superior fault tolerance through replication.

Unlike local file systems, DFS must additionally handle client–server communication, distributed naming, file location, caching, replication, and partial failure. These concerns fundamentally change semantics: where Unix offers strict one-copy update semantics on a single machine, distributed caching and replication typically weaken guarantees to improve performance and availability.

This survey selects five representative systems spanning three decades of research and industry practice:

| System | Era / context | Primary design goal |
|--------|---------------|---------------------|
| **NFS** | 1980s–present; general-purpose Unix sharing | Transparent remote file access in LAN environments |
| **AFS** | 1980s; campus-scale workstations | Scalable whole-file caching, reduced server load |
| **Coda** | 1990s; mobile & disconnected clients | Availability during network partition / disconnection |
| **GFS** | 2003; Google internal data processing | Fault-tolerant storage for huge append-heavy files |
| **HDFS** | 2006+; Hadoop ecosystem | Open-source GFS-style storage for batch analytics |

The evaluation framework follows the requirements outlined in distributed systems curricula: transparency, user mobility, performance, simplicity, scalability, high availability, high reliability, data integrity, security, heterogeneity, and consistency—an aspect that cuts across nearly every other dimension.

---

## 2. Background: From Local to Distributed File Services

### 2.1 Local file system structure

A non-distributed file system is organized in layers: directory module (name → file ID), file module (ID → file), access control, file access, block allocation, and device I/O. Operations such as `open`, `read`, `write`, `close`, and `stat` are mediated entirely within one kernel.

Mounting attaches a file system tree at a mount point—typically an empty directory—so the OS can traverse multiple partitions or devices under one namespace.

### 2.2 Distributed file service architecture

Classical DFS architecture separates concerns into:

1. **Flat file service** — operations on files identified by unique file identifiers (UFIDs).
2. **Directory service** — maps human-readable pathnames to UFIDs.
3. **Client module** — presents a unified API, caches data, and locates servers.

Two access models dominate (Tanenbaum & van Steen):

- **Remote access model** — clients perform `read`/`write` on remote servers via RPC (e.g., NFS).
- **Upload/download model** — clients fetch entire files (or large portions), modify locally, and write back (e.g., AFS, Coda).

The choice of model strongly influences caching behavior, consistency, and suitability for wide-area or mobile use.

### 2.3 Core requirements

Coulouris et al. identify transparency dimensions—access, location, mobility, performance, and scaling—as well as concurrency control, fault tolerance, replication, heterogeneity, consistency, security, and efficiency. DFS designs inevitably sacrifice some properties to strengthen others; critical evaluation therefore means judging *fitness for purpose*, not absolute ranking.

---

## 3. Case Studies

### 3.1 Sun Network File System (NFS)

NFS is among the most widely deployed DFS implementations. NFSv3 uses a stateless server model: the server does not keep open-file state on behalf of clients. Each request carries authentication information (UID/GID), and the server validates permissions against file attributes on every operation.

**Architecture.** The client-side Virtual File System (VFS) layer allows applications to use standard Unix system calls for both local and remote files. Remote files are referenced via opaque *file handles* containing a file-system ID, i-node number, and i-node generation number. A mount protocol returns the file handle for an exported directory; clients may hard-mount (block until server recovers) or soft-mount (fail after retries).

**Caching.** Client-side caching of `read`, `write`, `getattr`, `lookup`, and `readdir` results is central to NFS performance. Freshness is governed by a timestamp scheme: entries are presumed valid if `(T − Tc) < t` or if client and server modification times match; otherwise the client revalidates via `getattr`. Writes to cached pages are delayed (write-back); bio-daemons perform read-ahead and asynchronous flush. This improves throughput but weakens consistency—clients may observe stale data, and concurrent writers can produce unexpected interleavings.

**NFSv4 improvements.** Compound RPCs reduce round trips; integrated locking; callback-based delegation allows clients to cache more aggressively until the server recalls delegation.

**Critical note.** NFS prioritizes *access transparency* and Unix familiarity over strong consistency or disconnected operation. Security in early versions relied on AUTH_SYS (spoofable UIDs); Kerberos integration and RPCSEC_GSS address this but increase deployment complexity.

### 3.2 Andrew File System (AFS)

AFS (and its descendant OpenAFS) targets campus-scale environments with many workstations accessing shared file space. It uses an **upload/download** model with **whole-file** client caching: on open, the client may fetch an entire file; on close, changes are propagated to the server.

**Scalability mechanism.** AFS dramatically reduces server load by serving most reads from local disk cache. A single server can support far more clients than NFS-like designs that contact the server for many small operations. Location-independent file names (pathnames do not embed server addresses) support mobility transparency at the namespace level.

**Trade-offs.** Whole-file caching suits workloads with high read sharing and moderate file sizes. It performs poorly for huge files or fine-grained random writes. Consistency is session-oriented: other clients may not see updates until files are closed and callbacks invalidate caches.

**Security.** AFS integrated Kerberos-style authentication early, offering stronger identity guarantees than classic NFS—a significant advantage for multi-user academic and enterprise environments.

### 3.3 Coda

Coda extends AFS toward **disconnected and mobile operation**. When network connectivity is available, behavior resembles AFS. When disconnected, clients continue operating on cached copies; upon reconnection, Coda performs **reintegration**—merging local changes with server state.

**Availability focus.** Coda explicitly trades strong consistency for continued usability during partition. Conflicts may arise when multiple disconnected clients modify the same file; resolution policies (manual or automatic) are required.

**Relevance today.** While always-on connectivity has reduced the frequency of long disconnections, Coda’s ideas—local replicas, optimistic replication, conflict handling—inform mobile sync systems, edge caching, and intermittent connectivity scenarios.

### 3.4 Google File System (GFS)

GFS (Ghemawat et al., SOSP 2003) was designed for Google’s internal data-intensive workloads: large files, append-heavy writes, sequential reads, commodity hardware, and frequent component failure.

**Architecture.** A single *master* holds all metadata in memory (namespace, file-to-chunk mapping). *Chunkservers* store fixed-size chunks (64 MB default), replicated (typically 3×) across racks. Clients query the master for chunk locations, then read/write data directly from chunkservers—keeping the master off the data path.

**Workload assumptions.** Multi-GB files, append-mostly mutation, rare random overwrites, and tolerance for relaxed consistency. GFS introduces **record append** (atomic append-at-least-once) for multi-producer queues and **snapshot** (copy-on-write) for cheap branching of huge datasets.

**Fault tolerance.** Replication, chunk version numbers to detect stale replicas, checksums per 64 KB block, automatic re-replication, master operation log with checkpointing, and shadow masters for read-only metadata access during primary master failure.

**Consistency model.** Namespace operations are atomic. Data mutations yield regions that may be *consistent*, *defined*, or *undefined* depending on concurrency and failure—applications compensate via append-only writes, checkpoints, and record-level checksums.

**Critical note.** GFS is not a general-purpose POSIX replacement. Small files, random in-place updates, and low-latency interactive workloads are poor fits. The single-master design simplifies placement and replication policies but concentrates metadata management; shadow masters mitigate read availability but not write metadata availability during primary failure.

### 3.5 Hadoop Distributed File System (HDFS)

HDFS adapts GFS concepts for the open-source Hadoop ecosystem. It follows a similar master/slave pattern: **NameNode** (metadata) and **DataNodes** (block storage). Default block size is 128 MB (later versions); default replication factor is 3.

**Design alignment with MapReduce.** HDFS is co-designed with batch analytics: write once, read many times, large sequential scans. The NameNode is a known single point of failure in early versions; **High Availability (HA)** pairs with ZooKeeper failover and **JournalNodes** address this in production deployments.

**Comparison to GFS.** HDFS shares GFS’s strengths (throughput, fault tolerance, simplicity for append-heavy pipelines) and limitations (not suited for low-latency random access, POSIX incompleteness). Ecosystem tools (Hive, Spark) assume these semantics rather than fighting them.

---

## 4. Critical Evaluation by Design Dimension

### 4.1 Transparency

| System | Access | Location | Mobility | Performance | Scaling |
|--------|--------|----------|----------|-------------|---------|
| NFS | Strong — VFS integration | Partial — mount points expose server boundaries | Weak — client mounts must be reconfigured | Moderate — caching helps; server load limits scaling | Moderate |
| AFS | Strong for cached files | Strong — global namespace | Good — same path from any client | Good for read-heavy shared files | Good at campus scale |
| Coda | Good; semantics change when disconnected | Good | Strong — designed for mobile/disconnected use | Variable during reintegration | Moderate |
| GFS/HDFS | Application-specific API, not full POSIX | Path-based namespace; chunk placement hidden | N/A — datacenter batch jobs, not end-user desktops | Optimized for throughput, not single-op latency | Strong horizontal scale |

**Critical observation:** “Transparency” is not binary. NFS achieves syscall-level access transparency but exposes operational seams (mount configuration, stale cache). GFS hides distribution from applications that adopt its idiom but deliberately breaks POSIX expectations. Evaluators should distinguish *interface* transparency from *semantic* transparency.

### 4.2 User mobility

User mobility means accessing the same logical files from different machines without reconfiguration.

- **AFS/Coda** excel here through location-independent naming and aggressive client caching; Coda adds disconnected mobility.
- **NFS** requires per-client mount administration; automounters ease this but do not unify namespace across users (`/remote/mbox` vs `/work/mbox` problem noted in Tanenbaum).
- **GFS/HDFS** target service mobility (jobs run anywhere in the cluster) rather than human user roaming between laptops.

For modern “work from anywhere” expectations, AFS/Coda’s mobility model is conceptually ahead of NFS, though cloud sync (Dropbox, OneDrive) solved the problem differently outside traditional DFS.

### 4.3 Performance

Performance must be measured against workload:

- **NFS:** Client caching, read-ahead, and delayed writes deliver acceptable LAN performance for small-file Unix workloads. WAN latency and chatty metadata operations hurt; NFSv4 compounds mitigate RPC overhead.
- **AFS:** Minimizes server interactions via whole-file caching—excellent for read-heavy sharing, poor for large-file random I/O.
- **GFS/HDFS:** Optimized for aggregate bandwidth across many clients. GFS benchmarks show high aggregate read rates (hundreds of MB/s per cluster) but individual client write throughput can be modest due to replication and network stack behavior. **High sustained bandwidth matters more than low latency** in GFS’s design philosophy—a correct trade for batch analytics, wrong for OLTP.

**Verdict:** No universal winner; mismatch between design and workload is the primary cause of “poor DFS performance” in practice.

### 4.4 Simplicity and ease of use

- **NFS** wins on familiarity: standard Unix mounts and tools. Operational complexity appears in exports, mount options, locking semantics, and cache tuning.
- **AFS/Coda** require dedicated infrastructure and client software; administrators must understand cache invalidation and (for Coda) conflict resolution.
- **GFS/HDFS** are simpler *conceptually* for their target apps (append, replicate, batch read) but demand application redesign. POSIX incompleteness and relaxed consistency shift complexity from the filesystem to application code.

Simplicity for the *operator* versus the *programmer* diverges sharply in modern systems.

### 4.5 Scalability

Scalability dimensions include number of clients, files, total bytes, and metadata operation rate.

- **NFS** stateless servers simplify horizontal scaling of server instances, but central file servers and metadata bottlenecks limit growth; millions of small files stress any single NFS server.
- **AFS** scaled to thousands of clients per cell through caching—groundbreaking for its era.
- **GFS/HDFS** scale to thousands of nodes and petabytes by partitioning data into large chunks/blocks and keeping hot metadata in memory on one (logical) master. GFS reports clusters with hundreds of TB and hundreds of chunkservers; master load is reduced by large chunk size and client-side caching of chunk locations. NameNode memory remains a scaling limit for very large file counts—an acknowledged constraint addressed in successor systems (e.g., GFS evolution, HDFS Federation).

### 4.6 High availability

Availability is the probability that the service can be used when needed.

- **NFS hard mounts** block clients during server outage—high server availability required; soft mounts fail fast but risk application errors.
- **Coda** maximizes client-side availability during network partition at the cost of reconciliation complexity.
- **GFS/HDFS** achieve high availability through replication across racks, fast recovery, automatic re-replication, and (in HDFS HA) failover NameNodes. Individual machine or disk failure is routine and non-catastrophic. Master/NameNode failure is more disruptive but bounded by recovery mechanisms.

**Critical point:** Replication improves availability of *data* but does not automatically improve availability of *consistent, up-to-date* views—consistency semantics still matter.

### 4.7 High reliability

Reliability is sustained correctness over time despite faults.

- **NFS** relies on server disk reliability; client write-back caching risks data loss on client crash before flush.
- **GFS/HDFS** treat component failure as normal; triple replication, checksums, version numbers, and background scrubbing provide strong reliability for large sequential objects. Record append’s at-least-once semantics require application-level idempotence for strict reliability of processing pipelines.

GFS’s explicit checksum verification on read and periodic chunk scanning exemplifies **defense in depth**—essential when thousands of commodity disks make silent corruption statistically likely.

### 4.8 Data integrity

| System | Integrity mechanisms | Weakness |
|--------|---------------------|----------|
| NFS | Server as source of truth; optional secure RPC | Client cache staleness; client crash before flush |
| AFS/Coda | Server validation on reintegration | Conflict merges may produce semantically invalid merges |
| GFS/HDFS | Per-block checksums, version numbers, replication | Relaxed consistency; duplicate records after append retries |

For financial or collaborative editing workloads requiring immediate global consistency, none of these systems (in default configurations) suffice without additional locking or application protocols.

### 4.9 Security

- **NFS (historically):** AUTH_SYS trust model is fundamentally weak on open networks; Kerberos/RPCSEC_GSS are necessary for serious deployments.
- **AFS:** Integrated authentication stronger than early NFS.
- **GFS/HDFS:** Rudimentary permissions and quotas evolved over time; primary deployment is inside trusted datacenters. Kerberos-backed Hadoop security exists but adds operational burden.

**Heterogeneity and security intersect:** supporting many client OS types (NFS’s strength) complicates uniform security policy compared to a homogeneous Linux cluster (GFS/HDFS).

### 4.10 Heterogeneity

- **NFS** supports diverse Unix-like systems and, via implementations, Windows—strong heterogeneity at the client API level.
- **AFS/Coda** require specific client modules but support multiple Unix platforms.
- **GFS/HDFS** assume Linux commodity nodes; heterogeneity is intentionally limited to simplify operations and performance tuning.

### 4.11 Consistency and concurrency (cross-cutting)

Coulouris et al. contrast strict one-copy semantics with weaker guarantees under replication and caching. Tanenbaum presents four sharing semantics: Unix-like, session, immutable, transaction-like.

- **NFS:** Approximates session or weak Unix semantics depending on cache timers and close-to-open consistency.
- **AFS:** Session semantics predominate.
- **Coda:** Weak during disconnection; reconciliation may violate intuitive “last writer wins.”
- **GFS/HDFS:** Explicitly documented relaxed model; applications use append and checkpoints.

**Concurrency control** via file locking exists in NFSv4 but carries cost; many DFS workloads avoid shared write concurrency by design (partitioning files per writer in MapReduce).

---

## 5. Comparative Synthesis

The following table summarizes qualitative ratings for typical intended workloads (not universal truth):

| Criterion | NFS | AFS | Coda | GFS | HDFS |
|-----------|-----|-----|------|-----|------|
| Transparency (general Unix) | ★★★★ | ★★★ | ★★★ | ★★ | ★★ |
| User mobility | ★★ | ★★★★ | ★★★★★ | ★ | ★ |
| Performance (LAN / small files) | ★★★ | ★★★★ | ★★★ | ★ | ★ |
| Performance (cluster / big data) | ★ | ★ | ★ | ★★★★★ | ★★★★★ |
| Simplicity (Unix admin) | ★★★★ | ★★ | ★★ | ★★ | ★★ |
| Scalability (clients / capacity) | ★★★ | ★★★★ | ★★★ | ★★★★★ | ★★★★★ |
| Availability | ★★★ | ★★★ | ★★★★★ | ★★★★★ | ★★★★ |
| Reliability (commodity scale) | ★★★ | ★★★ | ★★★ | ★★★★★ | ★★★★★ |
| Data integrity (detect corruption) | ★★ | ★★★ | ★★★ | ★★★★★ | ★★★★★ |
| Security (modern open network) | ★★★* | ★★★★ | ★★★★ | ★★★ | ★★★ |
| Heterogeneity | ★★★★★ | ★★★★ | ★★★★ | ★★ | ★★ |

\*With Kerberos/RPCSEC_GSS properly deployed.

### 5.1 Design lessons

1. **Workload drives architecture.** GFS’s success confirms that reexamining POSIX assumptions for append-heavy, read-many workloads yields better results than forcing MapReduce onto NFS.

2. **Caching is double-edged.** Client caching enables performance and mobility (AFS, Coda, NFS) but complicates consistency—a recurring theme from Coulouris and Tanenbaum.

3. **Stateless vs. stateful servers.** NFS statelessness aids recovery but pushes complexity to clients (caching, locking). GFS’s master holds rich state but replicates and checkpoints it aggressively.

4. **Failure as norm.** GFS/HDFS embody a paradigm shift: at thousands of nodes, component failure is routine; reliability emerges from replication and detection, not from preventing failure.

5. **Semantic relaxation requires application discipline.** Record append, checkpointing, and immutable outputs are not filesystem limitations alone—they are contracts between storage and application layers.

---

## 6. Other Relevant Topics

### 6.1 Distributed computing context

DFS sit at the foundation of distributed computing stacks: configuration management, logs, checkpoints, and datasets for parallel frameworks all assume a shared storage layer. HDFS enabled Hadoop; GFS enabled Google’s internal pipelines; NFS still underpins legacy enterprise workloads. Object stores (Amazon S3, Azure Blob) partially supersede classical DFS for cloud-native apps, offering extreme scalability with even weaker POSIX semantics.

### 6.2 Evolution and successor systems

- **NFSv4.1+** — parallel NFS (pNFS) improves scalability by separating metadata and data paths.
- **Ceph, GlusterFS** — unify block, file, and object storage with distributed metadata.
- **Colossus / Bigtable / Spanner storage** — Google’s post-GFS infrastructure addresses master scale and global distribution.

Understanding NFS, AFS, Coda, GFS, and HDFS provides the conceptual vocabulary to evaluate these successors critically rather than treating them as unrelated products.

### 6.3 When to choose which

| Scenario | Reasonable choice |
|----------|-------------------|
| Legacy Unix application sharing in LAN | NFS |
| Campus-wide shared home directories, read-heavy | AFS (or modern equivalent) |
| Mobile users with intermittent connectivity | Coda-style disconnected DFS or sync services |
| Petabyte batch analytics, append logs | HDFS / object store |
| Internal Google-scale data pipeline (historical reference) | GFS design principles |

---

## 7. Conclusion

Distributed file systems are not a solved problem with a single best implementation. They are a family of solutions negotiating tensions articulated decades ago—transparency versus performance, consistency versus availability, simplicity versus scale—and reinterpreted as hardware scale and workload patterns change.

**NFS** remains the reference for transparent Unix remote file access but exposes weaknesses in security (without hardening), consistency, and extreme scale. **AFS** demonstrated that whole-file caching and global namespaces could scale shared academic computing. **Coda** pushed availability into disconnected environments, foreshadowing mobile and edge computing needs. **GFS** and **HDFS** redefined DFS for the big-data era, accepting relaxed POSIX semantics and centralized metadata in exchange for fault tolerance and aggregate throughput on commodity clusters.

A critical literature evaluation must therefore ask not “which DFS is best?” but “which requirements dominate for this application, and which weaknesses are acceptable?” Students and practitioners who internalize these trade-offs—rather than memorizing feature lists—are better equipped to design, deploy, and critique distributed storage in modern systems.

---

## References

1. Coulouris, G., Dollimore, J., Kindberg, T., & Blair, G. *Distributed Systems: Concepts and Design* (5th ed.), Chapter 12 — Distributed File Systems.
2. Tanenbaum, A. S., & van Steen, M. *Distributed Systems: Principles and Paradigms*, Chapter 11 — File Systems.
3. Ghemawat, S., Gobioff, H., & Leung, S.-T. (2003). *The Google File System.* Proceedings of SOSP ’03.
4. Howard, J. H., et al. (1988). *Scale and Performance in a Distributed File System (AFS).* ACM Transactions on Computer Systems.
5. Kistler, J. J., & Satyanarayanan, M. (1992). *Disconnected Operation in the Coda File System.* ACM Transactions on Computer Systems.
6. Sandberg, R., et al. (1985). *Design and Implementation of the Sun Network Filesystem.* USENIX Summer Conference.
7. Shvachko, K., et al. (2010). *The Hadoop Distributed File System.* IEEE MSST.
8. Course materials: Dr. Dilum Bandara, Prof. Iman Elghandour — Distributed File Systems slides.
9. Wikipedia. *List of file systems — Distributed file systems.* https://en.wikipedia.org/wiki/List_of_file_systems#Distributed_file_systems

---

*Word count: approximately 3,400 words (~7–8 pages at 12pt, 1.5 line spacing)*
